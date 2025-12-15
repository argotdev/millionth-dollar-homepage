/**
 * Millionth Dollar Homepage - x402 Protocol Server
 *
 * This server demonstrates the x402 payment protocol by selling pixels
 * for $0.000001 each (one millionth of a dollar).
 *
 * The x402 protocol flow:
 * 1. Client makes a request to a paid endpoint (e.g., POST /pixel)
 * 2. Server responds with 402 Payment Required + payment details
 * 3. Client signs an ERC-3009 TransferWithAuthorization
 * 4. Client retries with X-PAYMENT header containing the signed auth
 * 5. Server verifies payment via facilitator and processes request
 */

import express from "express";
import cors from "cors";
import { paymentMiddleware } from "x402-express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI client for image generation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 4021;
const NETWORK = process.env.NETWORK || "base-sepolia";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

if (!WALLET_ADDRESS) {
  console.error("ERROR: WALLET_ADDRESS environment variable is required");
  console.error(
    "This is the wallet that will receive payments from pixel purchases."
  );
  process.exit(1);
}

// =============================================================================
// CANVAS CONFIGURATION
// =============================================================================

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;

// Price per pixel: $0.0001 (one ten-thousandth of a dollar)
// 1,000,000 pixels × $0.0001 = $100.00 total if every pixel is sold
const PIXEL_PRICE = "$0.0001";

// =============================================================================
// DATA STRUCTURES
// =============================================================================

interface PixelData {
  color: string;
  owner: string; // Wallet address or agent identifier
  adId?: string; // Reference to the ad this pixel belongs to
  timestamp: number;
}

interface AdPlacement {
  id: string;
  owner: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixels: number;
  totalCost: string;
  imageId: string; // Reference to generated image
  imageUrl: string; // URL to serve the image
  linkUrl: string; // Where clicking the ad goes
  title: string; // Hover tooltip text
  timestamp: number;
}

interface GeneratedImage {
  data: Buffer;
  contentType: string;
}

// In-memory storage
const canvas: Map<string, PixelData> = new Map();
const adPlacements: AdPlacement[] = [];
const generatedImages: Map<string, GeneratedImage> = new Map();
let totalRevenue = 0;
let totalPixelsSold = 0;

// =============================================================================
// LOGGING UTILITIES
// =============================================================================

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function logPaymentFlow(step: string, details: Record<string, unknown>) {
  console.log(`\n[x402] ${step}`);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`       ${key}: ${JSON.stringify(value)}`);
  });
}

// =============================================================================
// EXPRESS SETUP
// =============================================================================

app.use(cors());
app.use(express.json());

// Custom logging middleware to show x402 flow
app.use((req, res, next) => {
  const hasPayment = req.headers["x-payment"];
  if (req.method === "POST" && (req.path === "/pixel" || req.path === "/ad")) {
    if (hasPayment) {
      logPaymentFlow("Request with payment received", {
        method: req.method,
        path: req.path,
        hasPaymentHeader: true,
        paymentHeaderLength: (hasPayment as string).length,
      });
    } else {
      logPaymentFlow("Initial request (no payment)", {
        method: req.method,
        path: req.path,
        note: "Will respond with 402 Payment Required",
      });
    }
  }
  next();
});

// =============================================================================
// x402 PAYMENT MIDDLEWARE
// =============================================================================

/**
 * The x402-express middleware handles the payment verification.
 *
 * When a request comes in without payment:
 * - Returns 402 with payment requirements (price, network, payTo address)
 *
 * When a request comes in with X-PAYMENT header:
 * - Decodes the payment data
 * - Forwards to facilitator for on-chain verification
 * - If valid, allows request to proceed
 * - If invalid, returns 402 with error
 */
app.use(
  paymentMiddleware(
    WALLET_ADDRESS,
    {
      // Single pixel purchase
      "POST /pixel": {
        price: PIXEL_PRICE,
        network: NETWORK,
        description: "Paint one pixel on the Millionth Dollar Homepage",
      },
      // Bulk ad placement
      "POST /ad": {
        price: PIXEL_PRICE,
        network: NETWORK,
        description: "Place a rectangular ad (price per pixel)",
      },
    },
    {
      url: FACILITATOR_URL,
    }
  )
);

// =============================================================================
// FREE ENDPOINTS (No payment required)
// =============================================================================

/**
 * GET /info - Public information about the homepage
 */
app.get("/info", (req, res) => {
  res.json({
    name: "The Millionth Dollar Homepage",
    description:
      "A 1000x1000 pixel canvas where each pixel costs $0.000001 USDC",
    canvas: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      totalPixels: CANVAS_WIDTH * CANVAS_HEIGHT,
    },
    pricing: {
      pricePerPixel: PIXEL_PRICE,
      currency: "USDC",
      network: NETWORK,
      totalValueIfFull: "$100.00",
    },
    stats: {
      pixelsSold: totalPixelsSold,
      pixelsRemaining: CANVAS_WIDTH * CANVAS_HEIGHT - totalPixelsSold,
      percentageSold: (
        (totalPixelsSold / (CANVAS_WIDTH * CANVAS_HEIGHT)) *
        100
      ).toFixed(4),
      totalRevenue: `$${totalRevenue.toFixed(6)}`,
      adPlacements: adPlacements.length,
    },
    payment: {
      receivingWallet: WALLET_ADDRESS,
      facilitator: FACILITATOR_URL,
    },
  });
});

/**
 * GET /canvas - Get all painted pixels
 */
app.get("/canvas", (req, res) => {
  const pixels: Array<{
    x: number;
    y: number;
    color: string;
    owner: string;
    url?: string;
  }> = [];

  canvas.forEach((data, key) => {
    const [x, y] = key.split(",").map(Number);
    pixels.push({
      x,
      y,
      color: data.color,
      owner: data.owner,
      url: data.url,
    });
  });

  res.json({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    pixels,
    totalPixels: pixels.length,
  });
});

/**
 * GET /ads - List all ad placements with full metadata
 */
app.get("/ads", (req, res) => {
  res.json({
    placements: adPlacements.map((ad) => ({
      ...ad,
      imageUrl: `http://localhost:${PORT}/images/${ad.imageId}`,
    })),
    total: adPlacements.length,
  });
});

/**
 * GET /images/:id - Serve generated ad images
 */
app.get("/images/:id", (req, res) => {
  const image = generatedImages.get(req.params.id);
  if (image) {
    res.contentType(image.contentType).send(image.data);
  } else {
    res.status(404).json({ error: "Image not found" });
  }
});

/**
 * POST /generate-image - Generate an ad image using GPT-5.2
 *
 * This is a FREE endpoint (no x402 payment) - image generation is a service
 * to help agents create ads. The actual ad placement costs money.
 */
app.post("/generate-image", async (req, res) => {
  const { prompt, width, height } = req.body;

  // Validate dimensions (must be multiples of 10, minimum 10x10)
  if (typeof width !== "number" || typeof height !== "number") {
    return res.status(400).json({ error: "width and height must be numbers" });
  }

  if (width < 10 || height < 10) {
    return res.status(400).json({ error: "Minimum dimensions are 10x10" });
  }

  if (width % 10 !== 0 || height % 10 !== 0) {
    return res.status(400).json({ error: "Dimensions must be multiples of 10" });
  }

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }

  console.log(`\n[IMAGE] Generating ${width}x${height} ad image...`);
  console.log(`[IMAGE] Prompt: ${prompt}`);

  try {
    // Call OpenAI's image generation API (gpt-image-1 / GPT-5.2)
    // gpt-image-1 returns base64-encoded images by default
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Create a small pixel advertisement banner image: ${prompt}. Style: simple, bold, colorful, eye-catching, suitable for a tiny ${width}x${height} pixel display on a website. Make text large and readable. No fine details.`,
      n: 1,
      size: "1024x1024", // Generate at high res, will be displayed scaled
    });

    // gpt-image-1 returns b64_json by default, not URL
    const imageData = response.data[0];
    let imageBuffer: Buffer;

    if (imageData.b64_json) {
      // Decode base64 image data
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      // Fallback to URL if provided
      const imageResponse = await fetch(imageData.url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else {
      throw new Error("No image data returned from OpenAI");
    }

    // Store with unique ID
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    generatedImages.set(imageId, {
      data: imageBuffer,
      contentType: "image/png",
    });

    console.log(`[IMAGE] Generated successfully: ${imageId}`);

    res.json({
      success: true,
      imageId,
      imageUrl: `http://localhost:${PORT}/images/${imageId}`,
      width,
      height,
    });
  } catch (err) {
    console.error("[IMAGE] Generation failed:", err);
    res.status(500).json({
      error: "Image generation failed",
      details: String(err),
    });
  }
});

/**
 * GET /pixel/:x/:y - Check if a pixel is available
 */
app.get("/pixel/:x/:y", (req, res) => {
  const x = parseInt(req.params.x);
  const y = parseInt(req.params.y);

  if (isNaN(x) || isNaN(y) || x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  const key = `${x},${y}`;
  const pixel = canvas.get(key);

  if (pixel) {
    res.json({
      x,
      y,
      available: false,
      ...pixel,
    });
  } else {
    res.json({
      x,
      y,
      available: true,
      price: PIXEL_PRICE,
    });
  }
});

// =============================================================================
// PAID ENDPOINTS (x402 payment required)
// =============================================================================

/**
 * POST /pixel - Paint a single pixel (costs $0.000001)
 *
 * The x402 middleware handles payment verification before this runs.
 * If we reach this handler, payment has been verified.
 */
app.post("/pixel", (req, res) => {
  const { x, y, color, owner, url } = req.body;

  // Validate coordinates
  if (typeof x !== "number" || typeof y !== "number") {
    return res.status(400).json({ error: "x and y must be numbers" });
  }

  if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
    return res.status(400).json({
      error: `Coordinates must be within (0-${CANVAS_WIDTH - 1}, 0-${CANVAS_HEIGHT - 1})`,
    });
  }

  // Validate color
  if (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({
      error: "Color must be a valid hex color (e.g., #FF0000)",
    });
  }

  const key = `${x},${y}`;
  const wasEmpty = !canvas.has(key);

  // Set the pixel
  canvas.set(key, {
    color: color.toUpperCase(),
    owner: owner || "anonymous",
    url,
    timestamp: Date.now(),
  });

  if (wasEmpty) {
    totalPixelsSold++;
    totalRevenue += 0.0001;
  }

  logPaymentFlow("Pixel painted successfully!", {
    coordinates: `(${x}, ${y})`,
    color: color.toUpperCase(),
    owner: owner || "anonymous",
    wasNewPixel: wasEmpty,
    totalRevenue: `$${totalRevenue.toFixed(6)}`,
  });

  res.json({
    success: true,
    x,
    y,
    color: color.toUpperCase(),
    owner: owner || "anonymous",
    url,
    cost: PIXEL_PRICE,
    totalPixelsSold,
  });
});

/**
 * POST /ad - Place a rectangular image ad (costs $0.0001 per pixel)
 *
 * Like the original Million Dollar Homepage:
 * - Minimum 10x10 block size
 * - Image-based ads (generated via /generate-image)
 * - Clickable link URL
 * - Hover tooltip title
 */
app.post("/ad", (req, res) => {
  const { x, y, width, height, imageId, linkUrl, title, owner } = req.body;

  // Validate dimensions
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "x, y, width, and height must be numbers" });
  }

  // Enforce minimum 10x10 block and multiples of 10
  if (width < 10 || height < 10) {
    return res
      .status(400)
      .json({ error: "Minimum ad size is 10x10 pixels (like the original Million Dollar Homepage)" });
  }

  if (width % 10 !== 0 || height % 10 !== 0) {
    return res
      .status(400)
      .json({ error: "Ad dimensions must be multiples of 10" });
  }

  if (width > 100 || height > 100) {
    return res
      .status(400)
      .json({ error: "Maximum ad size is 100x100 pixels" });
  }

  if (
    x < 0 ||
    y < 0 ||
    x + width > CANVAS_WIDTH ||
    y + height > CANVAS_HEIGHT
  ) {
    return res.status(400).json({ error: "Ad must fit within canvas bounds" });
  }

  // Validate imageId
  if (!imageId || typeof imageId !== "string") {
    return res.status(400).json({ error: "imageId is required (use /generate-image first)" });
  }

  if (!generatedImages.has(imageId)) {
    return res.status(400).json({ error: "Invalid imageId - image not found" });
  }

  // Validate linkUrl and title
  if (!linkUrl || typeof linkUrl !== "string") {
    return res.status(400).json({ error: "linkUrl is required" });
  }

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required (shown on hover)" });
  }

  const pixelCount = width * height;
  const adId = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let newPixels = 0;

  // Mark all pixels in the rectangle as belonging to this ad
  for (let px = x; px < x + width; px++) {
    for (let py = y; py < y + height; py++) {
      const key = `${px},${py}`;
      if (!canvas.has(key)) {
        newPixels++;
      }
      canvas.set(key, {
        color: "#AD0000", // Placeholder color - actual image is rendered on top
        owner: owner || "anonymous",
        adId,
        timestamp: Date.now(),
      });
    }
  }

  totalPixelsSold += newPixels;
  totalRevenue += newPixels * 0.0001;

  const placement: AdPlacement = {
    id: adId,
    owner: owner || "anonymous",
    x,
    y,
    width,
    height,
    pixels: pixelCount,
    totalCost: `$${(pixelCount * 0.0001).toFixed(4)}`,
    imageId,
    imageUrl: `http://localhost:${PORT}/images/${imageId}`,
    linkUrl,
    title,
    timestamp: Date.now(),
  };

  adPlacements.push(placement);

  logPaymentFlow("Ad placed successfully!", {
    adId,
    dimensions: `${width}x${height}`,
    position: `(${x}, ${y})`,
    pixelCount,
    newPixels,
    cost: `$${(pixelCount * 0.0001).toFixed(4)}`,
  });

  res.json({
    success: true,
    ...placement,
    newPixels,
    totalPixelsSold,
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  logSection("THE MILLIONTH DOLLAR HOMEPAGE");
  console.log(`
A demonstration of the x402 payment protocol.

Each pixel costs ${PIXEL_PRICE} USDC - one ten-thousandth of a dollar.
If every pixel sells, total revenue = $100.00

Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT} = ${(CANVAS_WIDTH * CANVAS_HEIGHT).toLocaleString()} pixels

Server: http://localhost:${PORT}
Network: ${NETWORK}
Receiving Wallet: ${WALLET_ADDRESS}
Facilitator: ${FACILITATOR_URL}

ENDPOINTS:
  FREE:
    GET  /info           - Homepage info and stats
    GET  /canvas         - All painted pixels
    GET  /ads            - List of ad placements with images
    GET  /images/:id     - Serve generated ad images
    GET  /pixel/:x/:y    - Check pixel availability
    POST /generate-image - Generate ad image with GPT-5.2

  PAID (x402):
    POST /pixel          - Paint one pixel (${PIXEL_PRICE})
    POST /ad             - Place image ad (${PIXEL_PRICE}/pixel, min 10x10)

x402 PAYMENT FLOW:
  1. Client POSTs to /pixel without payment
  2. Server returns 402 with payment requirements
  3. Client signs ERC-3009 TransferWithAuthorization
  4. Client retries with X-PAYMENT header
  5. Server verifies via facilitator
  6. Pixel is painted!
`);
  console.log("=".repeat(60));
  console.log("  Waiting for requests...");
  console.log("=".repeat(60));
});
