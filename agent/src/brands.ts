/**
 * Brand Configuration for the Millionth Dollar Homepage Ad Agent
 *
 * This file defines the diverse catalog of brands the agent can advertise.
 * Add, remove, or modify brands here to customize the ad content.
 */

export interface Brand {
  name: string;
  tagline: string;
  linkUrl: string;
  category:
    | "saas"
    | "d2c"
    | "fintech"
    | "devtools"
    | "health"
    | "food"
    | "travel"
    | "entertainment"
    | "crypto";
  colors: {
    primary: string;
    secondary: string;
  };
  keywords: string[]; // Used in image generation prompts
}

export const brands: Brand[] = [
  // =============================================================================
  // SaaS
  // =============================================================================
  {
    name: "CloudSync Pro",
    tagline: "Your files, everywhere",
    linkUrl: "https://cloudsync.io",
    category: "saas",
    colors: { primary: "#6366f1", secondary: "#ffffff" },
    keywords: ["cloud", "sync", "files", "storage", "folder icon"],
  },
  {
    name: "TeamFlow",
    tagline: "Collaboration without chaos",
    linkUrl: "https://teamflow.app",
    category: "saas",
    colors: { primary: "#10b981", secondary: "#1f2937" },
    keywords: ["team", "workflow", "productivity", "collaboration", "checkmarks"],
  },
  {
    name: "AnalyticsDash",
    tagline: "Insights that matter",
    linkUrl: "https://analyticsdash.io",
    category: "saas",
    colors: { primary: "#3b82f6", secondary: "#0f172a" },
    keywords: ["charts", "graphs", "data", "analytics", "dashboard"],
  },

  // =============================================================================
  // D2C / Consumer Products
  // =============================================================================
  {
    name: "BrewBox",
    tagline: "Craft coffee delivered",
    linkUrl: "https://brewbox.co",
    category: "food",
    colors: { primary: "#92400e", secondary: "#fef3c7" },
    keywords: ["coffee", "beans", "cup", "morning", "artisan", "steam"],
  },
  {
    name: "FitGear",
    tagline: "Workout anywhere",
    linkUrl: "https://fitgear.com",
    category: "health",
    colors: { primary: "#ef4444", secondary: "#000000" },
    keywords: ["fitness", "workout", "gym", "muscle", "dumbbell", "strong"],
  },
  {
    name: "GreenBite",
    tagline: "Plant-based, delivered",
    linkUrl: "https://greenbite.co",
    category: "food",
    colors: { primary: "#22c55e", secondary: "#f0fdf4" },
    keywords: ["salad", "vegetables", "healthy", "plant", "leaf", "fresh"],
  },
  {
    name: "PetPal",
    tagline: "Happy pets, happy life",
    linkUrl: "https://petpal.shop",
    category: "d2c",
    colors: { primary: "#f97316", secondary: "#fff7ed" },
    keywords: ["dog", "cat", "pet", "paw", "toys", "treats"],
  },

  // =============================================================================
  // DevTools / Infrastructure
  // =============================================================================
  {
    name: "x402 Protocol",
    tagline: "Pay per API call",
    linkUrl: "https://x402.org",
    category: "devtools",
    colors: { primary: "#00d4ff", secondary: "#1a1a2e" },
    keywords: ["API", "micropayments", "developer", "code", "lightning bolt"],
  },
  {
    name: "GitFlow CI",
    tagline: "Deploy in seconds",
    linkUrl: "https://gitflow.dev",
    category: "devtools",
    colors: { primary: "#f97316", secondary: "#18181b" },
    keywords: ["deploy", "CI/CD", "pipeline", "rocket", "automation", "git"],
  },
  {
    name: "LogStream",
    tagline: "Debug faster",
    linkUrl: "https://logstream.dev",
    category: "devtools",
    colors: { primary: "#a855f7", secondary: "#1e1b4b" },
    keywords: ["logs", "debugging", "terminal", "console", "monitoring"],
  },

  // =============================================================================
  // Fintech
  // =============================================================================
  {
    name: "SplitPay",
    tagline: "Bills made simple",
    linkUrl: "https://splitpay.io",
    category: "fintech",
    colors: { primary: "#8b5cf6", secondary: "#ffffff" },
    keywords: ["payment", "split", "friends", "money", "wallet", "share"],
  },
  {
    name: "SaveSmart",
    tagline: "Grow your savings",
    linkUrl: "https://savesmart.com",
    category: "fintech",
    colors: { primary: "#059669", secondary: "#ecfdf5" },
    keywords: ["savings", "piggy bank", "growth", "coins", "investment"],
  },

  // =============================================================================
  // Travel
  // =============================================================================
  {
    name: "NomadStays",
    tagline: "Work from anywhere",
    linkUrl: "https://nomadstays.com",
    category: "travel",
    colors: { primary: "#0ea5e9", secondary: "#f0f9ff" },
    keywords: ["travel", "laptop", "remote work", "coworking", "globe", "airplane"],
  },
  {
    name: "TrekTrail",
    tagline: "Adventure awaits",
    linkUrl: "https://trektrail.co",
    category: "travel",
    colors: { primary: "#84cc16", secondary: "#1a2e05" },
    keywords: ["hiking", "mountains", "nature", "trail", "backpack", "outdoor"],
  },

  // =============================================================================
  // Entertainment
  // =============================================================================
  {
    name: "StreamVibe",
    tagline: "Watch together",
    linkUrl: "https://streamvibe.tv",
    category: "entertainment",
    colors: { primary: "#ec4899", secondary: "#1e1e1e" },
    keywords: ["streaming", "movies", "popcorn", "watch party", "play button"],
  },
  {
    name: "GameVault",
    tagline: "Level up your library",
    linkUrl: "https://gamevault.gg",
    category: "entertainment",
    colors: { primary: "#eab308", secondary: "#1c1917" },
    keywords: ["gaming", "controller", "pixel art", "retro", "joystick"],
  },
  {
    name: "BeatDrop",
    tagline: "Music without limits",
    linkUrl: "https://beatdrop.fm",
    category: "entertainment",
    colors: { primary: "#06b6d4", secondary: "#0c0a09" },
    keywords: ["music", "headphones", "beats", "soundwave", "DJ"],
  },

  // =============================================================================
  // Crypto / Web3
  // =============================================================================
  {
    name: "BaseBridge",
    tagline: "Bridge to Base",
    linkUrl: "https://basebridge.io",
    category: "crypto",
    colors: { primary: "#0052FF", secondary: "#ffffff" },
    keywords: ["blockchain", "bridge", "transfer", "Base network", "crypto"],
  },
];
