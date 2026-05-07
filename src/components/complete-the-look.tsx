"use client";

import Link from "next/link";
import Image from "next/image";
import { useTasteProfile } from "./taste-profile-provider";
import { getProductClusters, COMPLEMENTARY_CATEGORIES, CLUSTER_LABELS } from "@/data/style-clusters";
import { products, getProduct } from "@/data/products";
import { getSellerById } from "@/data/sellers";
import type { Product, StyleCluster } from "@/types";

// Preview products shown in the empty-state tease
const PREVIEW_SLUGS = ["tote-bag", "stealth-hoodie", "lightweight-jacket-mens"];

interface CompleteTheLookProps {
  currentProduct: Product;
}

const RECENTLY_VIEWED_KEY = "stepforward-recently-viewed";

function loadRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pickRecommendations(currentProduct: Product, topClusters: StyleCluster[]): Product[] {
  const complementary = COMPLEMENTARY_CATEGORIES[currentProduct.productCategory] ?? [];

  // Recently viewed IDs (most recent first, excluding current product)
  const recentIds = loadRecentIds().filter((id) => id !== currentProduct.id);

  // Build candidate pool: recently viewed first (as priority), then rest
  const recentSet = new Set(recentIds);
  const recentProducts = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];
  const otherProducts = products.filter(
    (p) => !recentSet.has(p.id) && p.id !== currentProduct.id
  );

  // Score others by cluster match
  const scoredOthers = otherProducts
    .map((p) => {
      const pClusters = getProductClusters(p);
      const score = topClusters.filter((c) => pClusters.includes(c)).length;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);

  const candidates = [...recentProducts, ...scoredOthers];

  // Pick 3: complementary category + different seller + no duplicate image
  const picked: Product[] = [];
  const usedSellers = new Set<string>();
  const usedImages = new Set<string>();

  for (const p of candidates) {
    if (!complementary.includes(p.productCategory)) continue;
    if (usedSellers.has(p.sellerId)) continue;
    const img = p.colors[0]?.image;
    if (img && usedImages.has(img)) continue;
    picked.push(p);
    usedSellers.add(p.sellerId);
    if (img) usedImages.add(img);
    if (picked.length === 3) break;
  }

  return picked;
}

export function CompleteTheLook({ currentProduct }: CompleteTheLookProps) {
  const { hasEnoughSwipes, topClusters, openDeck, isComplete, resetProfile } = useTasteProfile();
  const primaryCluster = topClusters[0];

  if (!hasEnoughSwipes) {
    return (
      <EmptyState
        onOpen={openDeck}
        isComplete={isComplete}
        onRediscover={() => { resetProfile(); openDeck(); }}
      />
    );
  }

  const recommendations = pickRecommendations(currentProduct, topClusters);
  if (recommendations.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[2px] text-neutral-400 mb-1">Curated for you</p>
          <h2 className="text-2xl font-medium">Complete the Look</h2>
          {primaryCluster && (
            <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 inline-block" />
              Based on your{" "}
              <span className="text-charcoal font-medium">
                {CLUSTER_LABELS[primaryCluster]}
              </span>{" "}
              style
            </p>
          )}
        </div>
        <button
          onClick={() => { resetProfile(); openDeck(); }}
          className="text-[10px] uppercase tracking-[1.5px] text-neutral-400 hover:text-charcoal transition-colors pb-0.5 border-b border-neutral-300 hover:border-charcoal"
        >
          Re-discover your style
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {recommendations.map((product) => (
          <RecommendationCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ─── Personalised card ────────────────────────────────────────────────────────

function RecommendationCard({ product }: { product: Product }) {
  const seller = getSellerById(product.sellerId);
  const firstColor = product.colors[0];
  const imageSrc = firstColor.image;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className="relative aspect-square mb-3 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${firstColor.hex}33 0%, #ece9e2 70%)`,
        }}
      >
        {imageSrc.startsWith("/images/") && (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 33vw, 240px"
          />
        )}
      </div>
      <p className="text-[10px] uppercase tracking-[1px] text-neutral-400 mb-0.5">
        {product.productCategory}
      </p>
      <p className="text-[12px] font-medium uppercase tracking-[0.5px] mb-0.5">{product.name}</p>
      {seller && <p className="text-[11px] text-neutral-400 mb-0.5">{seller.name}</p>}
      <p className="text-[13px] font-medium">{product.price} zł</p>
    </Link>
  );
}

// ─── Empty state (first-time / unauthenticated) ────────────────────────────────

function EmptyState({
  onOpen,
  isComplete,
  onRediscover,
}: {
  onOpen: () => void;
  isComplete: boolean;
  onRediscover: () => void;
}) {
  const previewProducts = PREVIEW_SLUGS.map((s) => getProduct(s)).filter(Boolean) as Product[];

  return (
    <section className="py-12 border-t border-border">
      <p className="text-[10px] uppercase tracking-[2px] text-neutral-400 mb-1">Curated for you</p>
      <h2 className="text-2xl font-medium mb-8">Complete the Look</h2>

      {/* 4-column: 3 preview cards + 1 CTA panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {previewProducts.map((product) => (
          <PreviewCard key={product.id} product={product} />
        ))}

        {/* CTA panel */}
        <div className="border border-border p-6 flex flex-col justify-center gap-4 min-h-[280px]">
          <p className="text-[10px] uppercase tracking-[2px] text-neutral-400">
            Personalize this section
          </p>
          <p className="text-[18px] font-medium leading-snug">
            See pieces matched to your taste — across every category.
          </p>
          <p className="text-[12px] text-neutral-400 leading-relaxed">
            Swipe through a curated deck and we&apos;ll match accessories, tops and more — from sellers you haven&apos;t discovered yet.
          </p>
          {isComplete ? (
            <button
              onClick={onRediscover}
              className="bg-charcoal text-white text-[11px] uppercase tracking-[1.5px] px-5 py-3 rounded-full hover:bg-black transition-colors self-start"
            >
              Re-Discover your style
            </button>
          ) : (
            <button
              onClick={onOpen}
              className="bg-charcoal text-white text-[11px] uppercase tracking-[1.5px] px-5 py-3 rounded-full hover:bg-black transition-colors self-start"
            >
              Discover your style
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ product }: { product: Product }) {
  const firstColor = product.colors[0];
  const imageSrc = firstColor.image;

  return (
    <div className="relative group">
      <div
        className="relative aspect-square overflow-hidden mb-3"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${firstColor.hex}33 0%, #ece9e2 70%)`,
        }}
      >
        {imageSrc.startsWith("/images/") && (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        )}
        {/* Preview badge */}
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 flex items-center gap-1">
          <span className="text-[8px] text-neutral-400">✦</span>
          <span className="text-[9px] uppercase tracking-[1px] text-neutral-500 font-medium">Preview</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-[1px] text-neutral-400 mb-0.5">
        {product.productCategory}
      </p>
      <p className="text-[12px] font-medium uppercase tracking-[0.5px]">{product.name}</p>
    </div>
  );
}
