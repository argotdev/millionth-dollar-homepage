/**
 * Millionth Dollar Homepage - Multi-Brand Ad Agent
 *
 * This agent demonstrates how to:
 * 1. Set up a wallet using viem
 * 2. Wrap fetch with x402 payment handling
 * 3. Give an LLM tools to interact with a paid API
 * 4. Let the LLM make autonomous decisions about what ads to create
 *
 * The agent acts as a multi-brand advertising agency, placing diverse ads
 * for various fictional companies across different industries.
 */

import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithPayment } from "x402-fetch";

// Import brand, style, and size configurations
import { brands, Brand } from "./brands.js";
import { adStyles, AdStyle } from "./styles.js";
import { adSizes, AdSize } from "./sizes.js";

config();

// =============================================================================
// CONFIGURATION
// =============================================================================

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4021";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Validate required environment variables
if (!PRIVATE_KEY) {
  console.error(`
ERROR: PRIVATE_KEY environment variable is required

To create a wallet:
  1. Install cast: curl -L https://foundry.paradigm.xyz | bash && foundryup
  2. Generate a wallet: cast wallet new
  3. Copy the private key to your .env file

To fund the wallet with testnet USDC:
  1. Get Base Sepolia ETH from a faucet (for gas)
  2. Get USDC from the Circle faucet: https://faucet.circle.com/
`);
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error(`
ERROR: ANTHROPIC_API_KEY environment variable is required

Get an API key from: https://console.anthropic.com/
`);
  process.exit(1);
}

// =============================================================================
// WALLET SETUP
// =============================================================================

console.log("\n[WALLET] Setting up wallet...");
const account = privateKeyToAccount(PRIVATE_KEY);
console.log(`[WALLET] Address: ${account.address}`);

const walletClient = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});

console.log(`[WALLET] Connected to ${baseSepolia.name}`);

const fetchWithPay = wrapFetchWithPayment(fetch, walletClient);
console.log(`[WALLET] Payment-enabled fetch ready`);

// =============================================================================
// ANTHROPIC CLIENT
// =============================================================================

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// =============================================================================
// AD HISTORY TRACKING
// =============================================================================

interface PlacedAd {
  brand: string;
  style: string;
  size: string;
  round: number;
  timestamp: number;
}

const placedAdsHistory: PlacedAd[] = [];

function getRecentAdsContext(): string {
  const recent = placedAdsHistory.slice(-10);
  if (recent.length === 0) return "No ads placed yet in this session.";

  return `Recently placed ads:\n${recent
    .map((a) => `- Round ${a.round}: ${a.brand} (${a.style} style, ${a.size} size)`)
    .join("\n")}`;
}

function recordPlacedAd(brand: string, style: string, size: string, round: number) {
  placedAdsHistory.push({
    brand,
    style,
    size,
    round,
    timestamp: Date.now(),
  });
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const tools: Anthropic.Tool[] = [
  {
    name: "get_homepage_info",
    description:
      "Get information about the Millionth Dollar Homepage including stats, pricing, and available space.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_canvas",
    description:
      "Get the current state of the canvas showing all painted pixels and which areas are taken.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_ads",
    description:
      "Get a list of all current ad placements with their positions, sizes, and details.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_brands",
    description:
      "Get the list of available brands to advertise for, with their details including category, tagline, colors, and keywords.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_styles",
    description:
      "Get available visual styles for ads and which brand categories they suit best.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_sizes",
    description:
      "Get available ad size templates with dimensions, costs, and use cases.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "generate_ad_image",
    description:
      "Generate an ad image for a specific brand using a visual style. Uses GPT-5.2 to create the image. Returns an imageId to use with place_ad.",
    input_schema: {
      type: "object" as const,
      properties: {
        brandName: {
          type: "string",
          description: "Name of the brand to advertise (must match a brand from list_brands)",
        },
        style: {
          type: "string",
          description:
            "Visual style to use: minimalist, bold, neon, corporate, retro, playful, gradient, or nature",
        },
        size: {
          type: "string",
          description:
            "Size template to use: micro, small, banner, tall, medium, wide, large, billboard, or tower",
        },
        customPrompt: {
          type: "string",
          description:
            "Optional: Additional creative direction to add to the image generation prompt",
        },
      },
      required: ["brandName", "style", "size"],
    },
  },
  {
    name: "place_ad",
    description:
      "Place an image ad on the homepage. Requires an imageId from generate_ad_image. Costs $0.0001 per pixel.",
    input_schema: {
      type: "object" as const,
      properties: {
        x: {
          type: "number",
          description: "X coordinate of top-left corner (0-999)",
        },
        y: {
          type: "number",
          description: "Y coordinate of top-left corner (0-999)",
        },
        width: {
          type: "number",
          description: "Width in pixels (must match the generated image size)",
        },
        height: {
          type: "number",
          description: "Height in pixels (must match the generated image size)",
        },
        imageId: {
          type: "string",
          description: "The imageId returned from generate_ad_image",
        },
        linkUrl: {
          type: "string",
          description: "URL that users will visit when clicking the ad",
        },
        title: {
          type: "string",
          description: "Tooltip text shown when users hover over the ad",
        },
      },
      required: ["x", "y", "width", "height", "imageId", "linkUrl", "title"],
    },
  },
  {
    name: "find_empty_space",
    description:
      "Find an empty rectangular area on the canvas where an ad of the specified size could be placed.",
    input_schema: {
      type: "object" as const,
      properties: {
        width: {
          type: "number",
          description: "Desired width in pixels",
        },
        height: {
          type: "number",
          description: "Desired height in pixels",
        },
      },
      required: ["width", "height"],
    },
  },
];

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

async function getHomepageInfo(): Promise<string> {
  console.log("\n[TOOL] get_homepage_info");
  try {
    const res = await fetch(`${SERVER_URL}/info`);
    const data = await res.json();
    console.log("[TOOL] Success - got homepage info");
    return JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("[TOOL] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

async function getCanvas(): Promise<string> {
  console.log("\n[TOOL] get_canvas");
  try {
    const res = await fetch(`${SERVER_URL}/canvas`);
    const data = await res.json();
    console.log(`[TOOL] Success - got ${data.totalPixels} pixels`);
    return JSON.stringify({
      width: data.width,
      height: data.height,
      totalPixels: data.totalPixels,
      pixelCount: data.pixels.length,
      summary: `Canvas is ${data.width}x${data.height}. ${data.pixels.length} pixels are painted.`,
    });
  } catch (err) {
    console.error("[TOOL] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

async function getAds(): Promise<string> {
  console.log("\n[TOOL] get_ads");
  try {
    const res = await fetch(`${SERVER_URL}/ads`);
    const data = await res.json();
    console.log(`[TOOL] Success - got ${data.total} ads`);
    return JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("[TOOL] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

function listBrands(): string {
  console.log("\n[TOOL] list_brands");
  const brandList = brands.map((b) => ({
    name: b.name,
    tagline: b.tagline,
    category: b.category,
    linkUrl: b.linkUrl,
    colors: b.colors,
    keywords: b.keywords,
  }));
  console.log(`[TOOL] Returning ${brandList.length} brands`);
  return JSON.stringify(brandList, null, 2);
}

function listStyles(): string {
  console.log("\n[TOOL] list_styles");
  const styleList = adStyles.map((s) => ({
    name: s.name,
    description: s.description,
    suitableFor: s.suitableFor,
  }));
  console.log(`[TOOL] Returning ${styleList.length} styles`);
  return JSON.stringify(styleList, null, 2);
}

function listSizes(): string {
  console.log("\n[TOOL] list_sizes");
  const sizeList = adSizes.map((s) => ({
    name: s.name,
    width: s.width,
    height: s.height,
    cost: s.cost,
    description: s.description,
    useCase: s.useCase,
  }));
  console.log(`[TOOL] Returning ${sizeList.length} sizes`);
  return JSON.stringify(sizeList, null, 2);
}

// Track the last generated ad details for place_ad
let lastGeneratedAd: {
  brand: Brand;
  style: AdStyle;
  size: AdSize;
} | null = null;

async function generateAdImage(
  brandName: string,
  styleName: string,
  sizeName: string,
  customPrompt?: string
): Promise<string> {
  console.log(`\n[TOOL] generate_ad_image`);
  console.log(`[TOOL] Brand: ${brandName}, Style: ${styleName}, Size: ${sizeName}`);

  // Find the brand, style, and size
  const brand = brands.find(
    (b) => b.name.toLowerCase() === brandName.toLowerCase()
  );
  const style = adStyles.find(
    (s) => s.name.toLowerCase() === styleName.toLowerCase()
  );
  const size = adSizes.find(
    (s) => s.name.toLowerCase() === sizeName.toLowerCase()
  );

  if (!brand) {
    console.error(`[TOOL] Brand not found: ${brandName}`);
    return JSON.stringify({
      error: `Brand "${brandName}" not found. Use list_brands to see available brands.`,
    });
  }

  if (!style) {
    console.error(`[TOOL] Style not found: ${styleName}`);
    return JSON.stringify({
      error: `Style "${styleName}" not found. Use list_styles to see available styles.`,
    });
  }

  if (!size) {
    console.error(`[TOOL] Size not found: ${sizeName}`);
    return JSON.stringify({
      error: `Size "${sizeName}" not found. Use list_sizes to see available sizes.`,
    });
  }

  // Build a rich prompt combining brand + style
  const prompt = `
Create an advertisement banner for "${brand.name}" with the tagline "${brand.tagline}".

STYLE: ${style.description}

COLORS: Primary color ${brand.colors.primary}, secondary color ${brand.colors.secondary}. Use these colors prominently.

VISUAL ELEMENTS: Include imagery related to: ${brand.keywords.join(", ")}.

TEXT: Include the brand name "${brand.name}" and optionally the tagline "${brand.tagline}" if space allows.

${customPrompt ? `ADDITIONAL DIRECTION: ${customPrompt}` : ""}

The ad should be eye-catching and readable even at a small size (${size.width}x${size.height} pixels).
  `.trim();

  console.log(`[TOOL] Generated prompt for ${size.width}x${size.height} image`);

  try {
    const res = await fetch(`${SERVER_URL}/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        width: size.width,
        height: size.height,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[TOOL] Image generated: ${data.imageId}`);

      // Store the details for place_ad
      lastGeneratedAd = { brand, style, size };

      return JSON.stringify(
        {
          success: true,
          imageId: data.imageId,
          imageUrl: data.imageUrl,
          brand: brand.name,
          linkUrl: brand.linkUrl,
          suggestedTitle: `${brand.name} - ${brand.tagline}`,
          width: size.width,
          height: size.height,
          cost: size.cost,
        },
        null,
        2
      );
    } else {
      const error = await res.text();
      console.error(`[TOOL] Failed: ${error}`);
      return JSON.stringify({ error });
    }
  } catch (err) {
    console.error("[TOOL] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

async function placeAd(
  x: number,
  y: number,
  width: number,
  height: number,
  imageId: string,
  linkUrl: string,
  title: string,
  currentRound: number
): Promise<string> {
  const pixelCount = width * height;
  const cost = (pixelCount * 0.0001).toFixed(4);

  console.log(`\n[TOOL] place_ad ${width}x${height} at (${x}, ${y})`);
  console.log(`[x402] Ad size: ${pixelCount} pixels = $${cost} USDC`);
  console.log("[x402] Making payment request...");

  try {
    const response = await fetchWithPay(`${SERVER_URL}/ad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        x,
        y,
        width,
        height,
        imageId,
        linkUrl,
        title,
        owner: account.address,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[x402] Payment successful! Ad placed.`);
      console.log(`[x402] Cost: $${cost} USDC for ${pixelCount} pixels`);

      // Record the placed ad for history tracking
      if (lastGeneratedAd) {
        recordPlacedAd(
          lastGeneratedAd.brand.name,
          lastGeneratedAd.style.name,
          lastGeneratedAd.size.name,
          currentRound
        );
      }

      return JSON.stringify(data, null, 2);
    } else {
      const error = await response.text();
      console.error(`[x402] Request failed: ${error}`);
      return JSON.stringify({ error });
    }
  } catch (err) {
    console.error("[x402] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

async function findEmptySpace(width: number, height: number): Promise<string> {
  console.log(`\n[TOOL] find_empty_space ${width}x${height}`);

  try {
    const res = await fetch(`${SERVER_URL}/canvas`);
    const data = await res.json();

    const occupied = new Set<string>();
    for (const pixel of data.pixels) {
      occupied.add(`${pixel.x},${pixel.y}`);
    }

    // Generate ONLY random positions for more organic placement
    const candidates: Array<{ x: number; y: number }> = [];

    // Try 100 random positions across the entire canvas
    for (let i = 0; i < 100; i++) {
      candidates.push({
        x: Math.floor(Math.random() * (1000 - width)),
        y: Math.floor(Math.random() * (1000 - height)),
      });
    }

    // Round to 10-pixel grid
    for (const c of candidates) {
      c.x = Math.floor(c.x / 10) * 10;
      c.y = Math.floor(c.y / 10) * 10;
    }

    // Shuffle candidates for extra randomness
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Check each candidate
    for (const candidate of candidates) {
      if (candidate.x < 0 || candidate.y < 0) continue;
      if (candidate.x + width > 1000 || candidate.y + height > 1000) continue;

      let isEmpty = true;
      for (let px = candidate.x; px < candidate.x + width && isEmpty; px++) {
        for (let py = candidate.y; py < candidate.y + height && isEmpty; py++) {
          if (occupied.has(`${px},${py}`)) {
            isEmpty = false;
          }
        }
      }

      if (isEmpty) {
        console.log(`[TOOL] Found empty space at (${candidate.x}, ${candidate.y})`);
        return JSON.stringify({
          found: true,
          x: candidate.x,
          y: candidate.y,
          width,
          height,
        });
      }
    }

    console.log("[TOOL] No empty space found");
    return JSON.stringify({
      found: false,
      message: `Could not find empty ${width}x${height} space. Try a smaller size.`,
    });
  } catch (err) {
    console.error("[TOOL] Error:", err);
    return JSON.stringify({ error: String(err) });
  }
}

// =============================================================================
// TOOL DISPATCHER
// =============================================================================

let currentRound = 0;

async function processToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "get_homepage_info":
      return await getHomepageInfo();
    case "get_canvas":
      return await getCanvas();
    case "get_ads":
      return await getAds();
    case "list_brands":
      return listBrands();
    case "list_styles":
      return listStyles();
    case "list_sizes":
      return listSizes();
    case "generate_ad_image":
      return await generateAdImage(
        toolInput.brandName as string,
        toolInput.style as string,
        toolInput.size as string,
        toolInput.customPrompt as string | undefined
      );
    case "place_ad":
      return await placeAd(
        toolInput.x as number,
        toolInput.y as number,
        toolInput.width as number,
        toolInput.height as number,
        toolInput.imageId as string,
        toolInput.linkUrl as string,
        toolInput.title as string,
        currentRound
      );
    case "find_empty_space":
      return await findEmptySpace(
        toolInput.width as number,
        toolInput.height as number
      );
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

function buildSystemPrompt(): string {
  const brandSummary = brands
    .map((b) => `  - ${b.name}: "${b.tagline}" [${b.category}]`)
    .join("\n");

  const styleSummary = adStyles
    .map((s) => `  - ${s.name}: ${s.description.slice(0, 60)}...`)
    .join("\n");

  const sizeSummary = adSizes
    .map((s) => `  - ${s.name}: ${s.width}x${s.height} (${s.cost})`)
    .join("\n");

  return `You are an autonomous ad placement agent for the Millionth Dollar Homepage - acting as a multi-brand advertising agency.

YOUR IDENTITY:
- Wallet Address: ${account.address}
- Role: Creative Director placing ads for multiple client brands
- You have USDC on Base Sepolia for making ad purchases

AVAILABLE BRANDS (${brands.length} clients):
${brandSummary}

AVAILABLE STYLES (${adStyles.length} options):
${styleSummary}

AVAILABLE SIZES (${adSizes.length} templates):
${sizeSummary}

${getRecentAdsContext()}

YOUR STRATEGY:
1. Check what brands you've advertised recently - pick a DIFFERENT one this round
2. Choose a style that matches the brand's category (use list_styles to see which styles suit which categories)
3. Select an appropriate size based on the brand and your budget
4. Generate a creative image combining brand identity + visual style
5. Find good placement and place the ad

WORKFLOW:
1. Use list_brands, list_styles, list_sizes to see your options (or use your knowledge from the summaries above)
2. Use find_empty_space to locate available area for your chosen size
3. Use generate_ad_image with brandName, style, and size to create the image
4. Use place_ad with the imageId, coordinates, and brand's linkUrl

IMPORTANT GUIDELINES:
- VARY your choices! Don't repeat the same brand/style/size combinations
- Mix different industries: SaaS one round, food the next, devtools after that
- Try different visual styles to make the homepage interesting
- Budget: Place 1-2 ads per round, mix of sizes

TIPS FOR GREAT ADS:
- Match style to brand category (corporate for fintech, playful for food, neon for entertainment)
- Smaller ads are cheaper - good for experimentation
- Larger ads make more impact - good for key brands
- The homepage should look diverse and interesting!`;
}

// =============================================================================
// MAIN AGENT LOOP
// =============================================================================

async function runAgentLoop() {
  console.log("\n" + "=".repeat(60));
  console.log("  MILLIONTH DOLLAR HOMEPAGE - MULTI-BRAND AD AGENT");
  console.log("=".repeat(60));
  console.log(`
Wallet:  ${account.address}
Server:  ${SERVER_URL}
Network: ${baseSepolia.name}

This agent acts as an advertising agency for ${brands.length} brands.
- Images are generated by GPT-5.2
- Placement payments use x402 protocol
- Ads vary by brand, style, and size
`);
  console.log("=".repeat(60));

  let conversationHistory: Anthropic.MessageParam[] = [];

  while (true) {
    currentRound++;
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  ROUND ${currentRound}`);
    console.log(`${"=".repeat(60)}`);

    // Build fresh system prompt each round (includes updated ad history)
    const systemPrompt = buildSystemPrompt();

    // Start fresh conversation each round
    conversationHistory = [
      {
        role: "user",
        content: `Round ${currentRound}: Time to advertise!

Pick a brand you haven't advertised recently (or pick any if this is early).
Choose an interesting style that fits the brand.
Select a size that works for your creative vision.

Be creative! Make the homepage look diverse and interesting.`,
      },
    ];

    let continueLoop = true;

    while (continueLoop) {
      try {
        console.log("\n[LLM] Thinking...");

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          tools,
          messages: conversationHistory,
        });

        // Display LLM's thinking
        const textBlocks = response.content.filter(
          (block) => block.type === "text"
        );
        if (textBlocks.length > 0) {
          console.log(
            "\n[LLM]",
            textBlocks.map((b) => (b as Anthropic.TextBlock).text).join("\n")
          );
        }

        // Process tool calls
        if (response.stop_reason === "tool_use") {
          const toolUseBlocks = response.content.filter(
            (block) => block.type === "tool_use"
          );

          conversationHistory.push({
            role: "assistant",
            content: response.content,
          });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of toolUseBlocks) {
            if (block.type === "tool_use") {
              const result = await processToolCall(
                block.name,
                block.input as Record<string, unknown>
              );
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          conversationHistory.push({
            role: "user",
            content: toolResults,
          });
        } else {
          continueLoop = false;
        }
      } catch (err) {
        console.error("[LLM] Error:", err);
        continueLoop = false;
      }
    }

    // Wait before next round
    console.log(`\n[AGENT] Round ${currentRound} complete. Waiting 60 seconds...`);
    await sleep(60000);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start the agent
runAgentLoop().catch(console.error);
