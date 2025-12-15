# The Millionth Dollar Homepage

An educational demonstration of the **x402 payment protocol** - showing how AI agents can autonomously make micropayments to interact with paid APIs.

Inspired by the original Million Dollar Homepage, with:
- **$0.0001 per pixel** (one ten-thousandth of a dollar)
- **AI-generated ad images** (GPT-5.2 / gpt-image-1)
- **10x10 pixel block minimum** (like the original)
- **Hover tooltips and clickable links**
- **Payments via x402 protocol on Base**

## What is x402?

The x402 protocol enables HTTP-native micropayments using the `402 Payment Required` status code. It allows:

- **Servers** to monetize APIs with per-request payments
- **Clients** to pay automatically without manual wallet interactions
- **Agents** to autonomously spend money to accomplish goals

### The Protocol Flow

```
┌─────────┐                          ┌─────────┐                    ┌─────────────┐
│  Agent  │                          │ Server  │                    │ Facilitator │
└────┬────┘                          └────┬────┘                    └──────┬──────┘
     │                                    │                                │
     │ 1. POST /pixel (no payment)        │                                │
     │ ─────────────────────────────────> │                                │
     │                                    │                                │
     │ 2. 402 Payment Required            │                                │
     │    + payment details               │                                │
     │ <───────────────────────────────── │                                │
     │                                    │                                │
     │ 3. Sign ERC-3009 authorization     │                                │
     │    (TransferWithAuthorization)     │                                │
     │                                    │                                │
     │ 4. POST /pixel + X-PAYMENT header  │                                │
     │ ─────────────────────────────────> │                                │
     │                                    │                                │
     │                                    │ 5. Verify payment              │
     │                                    │ ───────────────────────────────>│
     │                                    │                                │
     │                                    │ 6. Execute transfer on-chain   │
     │                                    │ <───────────────────────────────│
     │                                    │                                │
     │ 7. 200 OK (pixel painted!)         │                                │
     │ <───────────────────────────────── │                                │
     │                                    │                                │
```

## Quick Start

```bash
# Install all dependencies
npm install

# Terminal 1: Start the server
npm run dev:server

# Terminal 2: Start the frontend
npm run dev:client

# Terminal 3: Run the agent
npm run dev:agent
```

## Project Structure

```
millionth-dollar-homepage/
├── server/                 # Express server with x402 middleware
│   └── src/index.ts        # Payment-protected pixel API
├── client/                 # React frontend
│   └── src/App.tsx         # Canvas viewer
└── agent/                  # LLM-powered ad placement agent
    └── src/index.ts        # Autonomous agent with wallet + tools
```

## How It Works

### 1. Server Setup (x402-express)

The server uses `x402-express` middleware to protect endpoints:

```typescript
import { paymentMiddleware } from "x402-express";

app.use(
  paymentMiddleware(
    WALLET_ADDRESS,  // Where payments go
    {
      "POST /pixel": {
        price: "$0.0001",
        network: "base-sepolia",
      },
    },
    { url: "https://x402.org/facilitator" }
  )
);
```

When a request comes in:
- **Without payment**: Returns `402 Payment Required` with payment details
- **With valid payment**: Allows the request through

### 2. Agent Setup (x402-fetch + viem)

The agent needs three things:

#### A. Wallet (viem)

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Create account from private key
const account = privateKeyToAccount(PRIVATE_KEY);

// Create wallet client for signing
const walletClient = createWalletClient({
  account,
  transport: http(),
  chain: baseSepolia,
});
```

#### B. Payment-Enabled Fetch (x402-fetch)

```typescript
import { wrapFetchWithPayment } from "x402-fetch";

// Wrap fetch to handle 402 responses automatically
const fetchWithPay = wrapFetchWithPayment(fetch, walletClient);
```

#### C. Making Paid Requests

```typescript
// This automatically handles the 402 flow!
const response = await fetchWithPay("http://server/pixel", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ x: 100, y: 100, color: "#FF0000" }),
});
```

What happens under the hood:
1. First request gets `402 Payment Required`
2. x402-fetch signs an ERC-3009 `TransferWithAuthorization`
3. Retries with `X-PAYMENT` header containing the signed auth
4. Server verifies and executes the payment

### 3. LLM Agent (Anthropic SDK)

The agent uses Claude with tool use to make autonomous decisions:

```typescript
const tools = [
  {
    name: "generate_ad_image",
    description: "Generate an ad image using GPT-5.2",
    input_schema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Image description" },
        width: { type: "number", description: "Width (multiple of 10)" },
        height: { type: "number", description: "Height (multiple of 10)" },
      },
    },
  },
  {
    name: "place_ad",
    description: "Place an image ad. Costs $0.0001/pixel.",
    input_schema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        imageId: { type: "string" },
        linkUrl: { type: "string" },
        title: { type: "string" },
      },
    },
  },
];

// Agent workflow: generate image, then place ad
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  tools,
  messages: [{ role: "user", content: "Create and place a creative ad!" }],
});
```

## Configuration

### Server (.env)

```bash
# Wallet that receives payments
WALLET_ADDRESS=0x...

# Network (base-sepolia or base)
NETWORK=base-sepolia

# x402 facilitator URL
FACILITATOR_URL=https://x402.org/facilitator

# OpenAI API key for GPT-5.2 image generation
OPENAI_API_KEY=sk-...
```

### Agent (.env)

```bash
# Wallet private key (needs USDC)
PRIVATE_KEY=0x...

# Server URL
SERVER_URL=http://localhost:4021

# Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...
```

## Wallet Setup

### Creating a Wallet

```bash
# Using Foundry's cast tool
cast wallet new

# Output:
# Address: 0x...
# Private key: 0x...
```

### Funding the Wallet

1. **Get Base Sepolia ETH** (for gas):
   - Coinbase Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet
   - Alchemy Faucet: https://sepoliafaucet.com/

2. **Get USDC** (for payments):
   - Circle Faucet: https://faucet.circle.com/
   - Note: Requires 0.001 mainnet ETH to verify

## API Reference

### Free Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /info` | Homepage stats and pricing |
| `GET /canvas` | All painted pixels |
| `GET /ads` | List of ad placements with image URLs |
| `GET /images/:id` | Serve generated ad images |
| `GET /pixel/:x/:y` | Check pixel availability |
| `POST /generate-image` | Generate ad image with GPT-5.2 |

### Paid Endpoints (x402)

| Endpoint | Cost | Description |
|----------|------|-------------|
| `POST /pixel` | $0.0001 | Paint one pixel |
| `POST /ad` | $0.0001/pixel | Place image ad (min 10x10, requires imageId)

## Key Concepts

### ERC-3009: TransferWithAuthorization

The x402 protocol uses ERC-3009, which allows:
- **Gasless transfers**: The payer doesn't pay gas
- **Signed authorizations**: Payer signs a message authorizing transfer
- **Server-side execution**: Server submits the transfer

```solidity
// The payer signs this authorization
transferWithAuthorization(
  from,      // Payer's address
  to,        // Recipient (server wallet)
  value,     // Amount in USDC
  validAfter,
  validBefore,
  nonce,
  signature
)
```

### Why x402?

Traditional API monetization requires:
- User accounts and auth
- Payment processing setup
- Subscription management
- Trust in the provider

x402 enables:
- **Anonymous access**: Pay per request, no account needed
- **Micropayments**: Sub-cent transactions are practical
- **Trustless**: Blockchain verifies payments
- **Agent-friendly**: Autonomous systems can pay

## Tech Stack

- **Server**: Express, x402-express, OpenAI SDK, TypeScript
- **Client**: React, Vite, TypeScript
- **Agent**: viem, x402-fetch, @anthropic-ai/sdk, TypeScript
- **Image Generation**: OpenAI gpt-image-1 (GPT-5.2)
- **Payments**: USDC on Base Sepolia via x402 protocol

## Resources

- [x402 Protocol](https://x402.org)
- [ERC-3009 Spec](https://eips.ethereum.org/EIPS/eip-3009)
- [viem Documentation](https://viem.sh)
- [Base Network](https://base.org)
- [Anthropic API](https://docs.anthropic.com)
