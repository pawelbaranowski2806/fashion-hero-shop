import type { Product, StyleCluster, ProductCategory } from "@/types";

// Cluster display names shown in UI
export const CLUSTER_LABELS: Record<StyleCluster, string> = {
  "romantic-feminine": "Romantic Feminine",
  "streetwear-urban": "Streetwear Urban",
  "minimal-classic": "Minimal Classic",
  "boho-natural": "Boho Natural",
  "party-glam": "Party Glam",
  "smart-casual": "Smart Casual",
};

// Derive clusters from product without modifying product data
export function getProductClusters(product: Product): StyleCluster[] {
  const clusters: StyleCluster[] = [];
  const tags = product.tags;
  const { sellerId, type } = product;

  const hasTag = (...t: string[]) => t.some((x) => tags.includes(x));

  if (
    hasTag("streetwear", "cargo", "bold", "reflective", "night-running") ||
    (sellerId === "s1" && ["runner", "trainer", "hoodie", "slide"].includes(type)) ||
    sellerId === "s10"
  ) {
    clusters.push("streetwear-urban");
  }

  if (
    hasTag("classic", "everyday", "vintage", "retro", "smart-casual") ||
    sellerId === "s9" ||
    (sellerId === "s7" && !hasTag("smart-casual"))
  ) {
    clusters.push("minimal-classic");
  }

  if (
    hasTag("sustainable", "natural", "handmade", "organic", "embroidered", "espadrille", "wool") ||
    sellerId === "s6" ||
    sellerId === "s8"
  ) {
    clusters.push("boho-natural");
  }

  if (
    (sellerId === "s8" && ["flat", "slide", "slip-on", "loafer"].includes(type)) ||
    (sellerId === "s2" && ["flat", "slip-on", "loafer"].includes(type)) ||
    hasTag("romantic", "feminine", "floral", "silk", "rose")
  ) {
    clusters.push("romantic-feminine");
  }

  if (
    hasTag("colorful", "patchwork", "neon") ||
    product.name.toLowerCase().includes("neon") ||
    product.name.toLowerCase().includes("glam")
  ) {
    clusters.push("party-glam");
  }

  if (
    hasTag("smart-casual", "merino", "linen", "chino", "desert-boot", "suede") ||
    sellerId === "s7"
  ) {
    clusters.push("smart-casual");
  }

  // Bella Donna (s2) products tend toward romantic-feminine / minimal-classic
  if (sellerId === "s2" && clusters.length === 0) {
    clusters.push("romantic-feminine", "minimal-classic");
  }

  // Fallback
  if (clusters.length === 0) clusters.push("minimal-classic");

  return [...new Set(clusters)];
}

// Which productCategories complement a given category (never same-category)
export const COMPLEMENTARY_CATEGORIES: Record<ProductCategory, ProductCategory[]> = {
  shoes: ["apparel", "accessories"],
  apparel: ["shoes", "accessories"],
  accessories: ["shoes", "apparel"],
  socks: ["shoes", "apparel"],
};

// 10 slugs shown in swipe deck — 2 shoes, 2 tops, 2 hoodies/outerwear, 2 pants, 2 accessories
// Chosen to cover all 6 style clusters across diverse sellers
export const SWIPE_DECK_SLUGS: string[] = [
  "cloud-runner",        // shoes · s1 · streetwear-urban / minimal-classic
  "glide-flat",          // shoes · s2 · romantic-feminine / minimal-classic
  "block-tee",           // top   · s1 · streetwear-urban
  "silk-cami",           // top   · s2 · romantic-feminine / party-glam
  "stealth-hoodie",      // hoodie · s1 · streetwear-urban
  "cardigan-womens",     // cardigan · s2 · romantic-feminine / minimal-classic
  "cargo-jogger",        // pants · s1 · streetwear-urban
  "wide-leg-pant-womens",// pants · s2 · romantic-feminine / minimal-classic
  "tote-bag",            // accessories · s11 · minimal-classic / boho-natural
  "wool-scarf-womens",   // accessories · s2 · romantic-feminine / minimal-classic
];
