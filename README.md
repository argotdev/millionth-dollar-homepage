# The Millionth Dollar Homepage

A modern recreation of the famous [Million Dollar Homepage](https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage), demonstrating the **x402 payment protocol** for HTTP-native micropayments.

- **1,000,000 pixels** on a 1000x1000 canvas
- **$0.0001 per pixel** (one ten-thousandth of a dollar)
- **AI-generated ad images** using GPT-5.2
- **Autonomous LLM agents** that place ads for multiple brands
- **x402 micropayments** on Base Sepolia

![Screenshot](https://via.placeholder.com/800x400?text=Millionth+Dollar+Homepage)

## How It Works

1. **Server** exposes paid endpoints protected by x402 middleware
2. **Agent** (powered by Claude) decides which brands to advertise
3. **Agent** generates ad images using GPT-5.2
4. **Agent** pays for ad placement using x402 protocol (USDC on Base)
5. **Client** displays the canvas with all placed ads

## Quick Start

### Prerequisites

- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com/))
- An OpenAI API key ([get one here](https://platform.openai.com/))
- A wallet with Base Sepolia USDC (see [Wallet Setup](#wallet-setup))

### 1. Install Dependencies

```bash
# From the project root
cd server && npm install
cd ../client && npm install
cd ../agent && npm install
```

### 2. Configure Environment

**Server** (`server/.env`):
```bash
# Your wallet address - receives payments from ad purchases
WALLET_ADDRESS=0xYourWalletAddressHere

# OpenAI API key for GPT-5.2 image generation
OPENAI_API_KEY=sk-your-openai-api-key

# Optional
PORT=4021
NETWORK=base-sepolia
FACILITATOR_URL=https://x402.org/facilitator
```

**Agent** (`agent/.env`):
```bash
# Private key of wallet with USDC (for paying for ads)
PRIVATE_KEY=0xYourPrivateKeyHere

# Anthropic API key for Claude
ANTHROPIC_API_KEY=sk-ant-your-key

# Optional
SERVER_URL=http://localhost:4021
```

### 3. Run the Project

Open three terminals:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

**Terminal 3 - Agent:**
```bash
cd agent
npm run dev
```

Then open http://localhost:5173 to see the homepage.

## Wallet Setup

The agent needs a wallet with Base Sepolia USDC to pay for ads.

### Create a Wallet

```bash
# Using Foundry's cast tool
curl -L https://foundry.paradigm.xyz | bash
foundryup
cast wallet new
```

Save the address and private key.

### Fund the Wallet

1. **Get Base Sepolia ETH** (for gas):
   - [Coinbase Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. **Get USDC** (for payments):
   - [Circle Faucet](https://faucet.circle.com/)
   - Note: Requires 0.001 mainnet ETH to verify

## Project Structure

```
millionth-dollar-homepage/
├── server/                 # Express server with x402 middleware
│   └── src/index.ts        # API endpoints, image generation
├── client/                 # React frontend (Vite)
│   └── src/App.tsx         # Canvas viewer with zoom/pan
└── agent/                  # LLM-powered ad agent
    └── src/
        ├── index.ts        # Agent loop with Claude
        ├── brands.ts       # Brand catalog (18 brands)
        ├── styles.ts       # Visual styles (8 styles)
        └── sizes.ts        # Ad size templates (9 sizes)
```

## API Endpoints

### Free Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /info` | Homepage stats and pricing |
| `GET /canvas` | All painted pixels |
| `GET /ads` | List of ad placements with images |
| `GET /images/:id` | Serve generated ad images |
| `POST /generate-image` | Generate ad image with GPT-5.2 |

### Paid Endpoints (x402)

| Endpoint | Cost | Description |
|----------|------|-------------|
| `POST /pixel` | $0.0001 | Paint one pixel |
| `POST /ad` | $0.0001/pixel | Place image ad (min 10x10) |

## The x402 Protocol

x402 enables HTTP-native micropayments using the `402 Payment Required` status code.

```
┌─────────┐                          ┌─────────┐
│  Agent  │                          │ Server  │
└────┬────┘                          └────┬────┘
     │                                    │
     │ 1. POST /ad (no payment)           │
     │ ─────────────────────────────────> │
     │                                    │
     │ 2. 402 Payment Required            │
     │    + payment details               │
     │ <───────────────────────────────── │
     │                                    │
     │ 3. Sign ERC-3009 authorization     │
     │                                    │
     │ 4. POST /ad + X-PAYMENT header     │
     │ ─────────────────────────────────> │
     │                                    │
     │ 5. 200 OK (ad placed!)             │
     │ <───────────────────────────────── │
```

The `x402-fetch` wrapper handles steps 2-4 automatically.

## Agent Features

The agent acts as a **multi-brand advertising agency**:

### Brands (18 clients across industries)
- **SaaS**: CloudSync Pro, TeamFlow, AnalyticsDash
- **Food**: BrewBox, GreenBite
- **Health**: FitGear
- **DevTools**: x402 Protocol, GitFlow CI, LogStream
- **Fintech**: SplitPay, SaveSmart
- **Travel**: NomadStays, TrekTrail
- **Entertainment**: StreamVibe, GameVault, BeatDrop
- **Crypto**: BaseBridge

### Visual Styles (8 options)
- minimalist, bold, neon, corporate, retro, playful, gradient, nature

### Ad Sizes (9 templates)
- micro (10x10), small (20x20), banner (50x20), tall (20x50), medium (30x30), wide (40x20), large (50x50), billboard (100x40), tower (30x60)

The agent tracks its history and varies brand/style/size combinations each round.

## Customization

### Add New Brands

Edit `agent/src/brands.ts`:

```typescript
{
  name: "YourBrand",
  tagline: "Your tagline here",
  linkUrl: "https://yourbrand.com",
  category: "saas", // saas, food, health, devtools, fintech, travel, entertainment, crypto
  colors: { primary: "#FF0000", secondary: "#FFFFFF" },
  keywords: ["keyword1", "keyword2", "keyword3"],
}
```

### Add New Styles

Edit `agent/src/styles.ts`:

```typescript
{
  name: "yourstyle",
  description: "Detailed description for GPT-5.2 image generation...",
  suitableFor: ["saas", "fintech"], // Which brand categories this suits
}
```

### Add New Sizes

Edit `agent/src/sizes.ts`:

```typescript
{
  name: "yoursize",
  width: 40,
  height: 30,
  description: "Custom rectangle",
  cost: "$0.12",
  useCase: "When to use this size",
}
```

## Tech Stack

- **Server**: Express, x402-express, OpenAI SDK, TypeScript
- **Client**: React, Vite, TypeScript
- **Agent**: Anthropic SDK, viem, x402-fetch, TypeScript
- **Payments**: USDC on Base Sepolia via x402 protocol
- **Image Generation**: OpenAI gpt-image-1 (GPT-5.2)

## Resources

- [x402 Protocol](https://x402.org)
- [ERC-3009 Spec](https://eips.ethereum.org/EIPS/eip-3009)
- [Base Network](https://base.org)
- [Anthropic API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)

## License

MIT
