/**
 * Ad Style Configuration for the Millionth Dollar Homepage Ad Agent
 *
 * This file defines visual styles that can be applied to ads.
 * Each style has a description that's used in the GPT-5.2 image generation prompt.
 */

export interface AdStyle {
  name: string;
  description: string; // Detailed description for image generation
  suitableFor: string[]; // Brand categories this style works well with
}

export const adStyles: AdStyle[] = [
  {
    name: "minimalist",
    description:
      "Clean, simple design with lots of whitespace. Single icon or logo centered. Sans-serif typography. Maximum 2 colors. No gradients, no textures. Focus on simplicity and clarity.",
    suitableFor: ["saas", "fintech", "devtools"],
  },
  {
    name: "bold",
    description:
      "High contrast design with large, bold text that dominates the space. Vibrant, saturated colors. Thick borders or geometric shapes. Text should be readable even at small sizes. Energetic and attention-grabbing.",
    suitableFor: ["d2c", "health", "entertainment", "food"],
  },
  {
    name: "neon",
    description:
      "Dark background (black or deep purple) with glowing neon colors. Cyberpunk aesthetic. Electric blues, hot pinks, bright purples. Glow effects around text and icons. Futuristic and tech-forward.",
    suitableFor: ["entertainment", "crypto", "devtools"],
  },
  {
    name: "corporate",
    description:
      "Professional, trustworthy appearance. Blue tones as primary color. Clean typography, subtle gradients. Conveys reliability and stability. Suitable for business audiences. Polished and refined.",
    suitableFor: ["saas", "fintech", "travel"],
  },
  {
    name: "retro",
    description:
      "Pixel art style, 8-bit aesthetic. Limited color palette (4-8 colors). Nostalgic gaming vibes. Blocky pixels visible. Reminiscent of classic video games and early internet.",
    suitableFor: ["entertainment", "food", "d2c"],
  },
  {
    name: "playful",
    description:
      "Fun and colorful with rounded shapes and friendly fonts. Emoji-like icons welcome. Approachable and warm feeling. Pastel or bright colors. Hand-drawn or cartoon-like elements.",
    suitableFor: ["food", "health", "travel", "d2c"],
  },
  {
    name: "gradient",
    description:
      "Modern gradient backgrounds flowing from one color to another. Smooth color transitions. Contemporary and trendy. Often purple-to-pink or blue-to-teal. Sleek and fashionable.",
    suitableFor: ["saas", "fintech", "entertainment", "crypto"],
  },
  {
    name: "nature",
    description:
      "Earthy, organic feel with greens, browns, and natural tones. Leaf or plant motifs. Eco-friendly and sustainable vibe. Textures like wood grain or paper. Calming and wholesome.",
    suitableFor: ["food", "health", "travel"],
  },
];
