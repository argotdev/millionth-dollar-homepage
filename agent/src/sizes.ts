/**
 * Ad Size Configuration for the Millionth Dollar Homepage Ad Agent
 *
 * This file defines standard ad size templates.
 * All dimensions must be multiples of 10 (server requirement).
 * Cost is calculated at $0.0001 per pixel.
 */

export interface AdSize {
  name: string;
  width: number;
  height: number;
  description: string;
  cost: string;
  useCase: string; // When to use this size
}

export const adSizes: AdSize[] = [
  {
    name: "micro",
    width: 10,
    height: 10,
    description: "Tiny icon ad",
    cost: "$0.01",
    useCase: "Simple logo or icon placement. Good for brand presence on a budget.",
  },
  {
    name: "small",
    width: 20,
    height: 20,
    description: "Small square ad",
    cost: "$0.04",
    useCase: "Small logo with short text. Compact but readable.",
  },
  {
    name: "banner",
    width: 50,
    height: 20,
    description: "Horizontal banner",
    cost: "$0.10",
    useCase: "Tagline-focused ads. Great for catchy slogans.",
  },
  {
    name: "tall",
    width: 20,
    height: 50,
    description: "Vertical skyscraper",
    cost: "$0.10",
    useCase: "Vertical logo with stacked text. Good for side placement.",
  },
  {
    name: "medium",
    width: 30,
    height: 30,
    description: "Medium square ad",
    cost: "$0.09",
    useCase: "Balanced space for logo and tagline. Versatile choice.",
  },
  {
    name: "wide",
    width: 40,
    height: 20,
    description: "Wide rectangle",
    cost: "$0.08",
    useCase: "Landscape format. Good for product showcases.",
  },
  {
    name: "large",
    width: 50,
    height: 50,
    description: "Large square ad",
    cost: "$0.25",
    useCase: "Premium placement. Room for imagery and text.",
  },
  {
    name: "billboard",
    width: 100,
    height: 40,
    description: "Wide billboard",
    cost: "$0.40",
    useCase: "Maximum visibility. Statement ad for major brands.",
  },
  {
    name: "tower",
    width: 30,
    height: 60,
    description: "Tall tower",
    cost: "$0.18",
    useCase: "Vertical emphasis. Good for app-style ads.",
  },
];
