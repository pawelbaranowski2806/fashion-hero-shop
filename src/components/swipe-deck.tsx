"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTasteProfile } from "./taste-profile-provider";
import { getProductClusters, CLUSTER_LABELS, SWIPE_DECK_SLUGS } from "@/data/style-clusters";
import { getProduct } from "@/data/products";
import type { Product } from "@/types";
import { CloseIcon } from "./icons";

function loadDeckProducts(): Product[] {
  return SWIPE_DECK_SLUGS.map((slug) => getProduct(slug)).filter(Boolean) as Product[];
}

type EjectDir = "right" | "left" | null;

// ─── SwipeCard ────────────────────────────────────────────────────────────────
// Receives ejectDir + hoverDir from parent so buttons can drive animation

interface SwipeCardProps {
  product: Product;
  nextProduct: Product | undefined;
  ejectDir: EjectDir;
  hoverDir: EjectDir;
  onDragSwipe: (direction: "like" | "pass") => void;
}

function SwipeCard({ product, nextProduct, ejectDir, hoverDir, onDragSwipe }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragEjectDir, setDragEjectDir] = useState<EjectDir>(null);
  const startXRef = useRef(0);
  const THRESHOLD = 90;

  const firstColor = product.colors[0];
  const imageSrc = firstColor.image;

  // Reset drag state when product changes (new card)
  useEffect(() => {
    setDragX(0);
    setIsDragging(false);
    setDragEjectDir(null);
  }, [product.id]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (ejectDir || dragEjectDir) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || ejectDir || dragEjectDir) return;
    setDragX(e.clientX - startXRef.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > THRESHOLD) {
      setDragEjectDir("right");
      setTimeout(() => onDragSwipe("like"), 300);
    } else if (dragX < -THRESHOLD) {
      setDragEjectDir("left");
      setTimeout(() => onDragSwipe("pass"), 300);
    } else {
      setDragX(0);
    }
  };

  // Priority: button eject > drag eject > hover tilt > manual drag
  const activeEject = ejectDir ?? dragEjectDir;
  const isEjecting = !!activeEject;

  const HOVER_OFFSET = 28;
  const hoverOffset = hoverDir === "right" ? HOVER_OFFSET : hoverDir === "left" ? -HOVER_OFFSET : 0;

  const translateX = isEjecting
    ? `${activeEject === "right" ? 160 : -160}vw`
    : isDragging
    ? `${dragX}px`
    : `${hoverOffset}px`;

  const rotate = isEjecting
    ? activeEject === "right" ? 22 : -22
    : isDragging
    ? dragX / 18
    : hoverDir === "right" ? 5 : hoverDir === "left" ? -5 : 0;

  // Opacity for labels — driven by whichever is active
  const rawOffset = isEjecting
    ? (activeEject === "right" ? THRESHOLD * 2 : -THRESHOLD * 2)
    : isDragging ? dragX : hoverOffset;

  const likeOpacity = Math.min(Math.max(rawOffset / THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-rawOffset / THRESHOLD, 0), 1);

  // Next card scale: grows as current card leaves
  const nextScale = isEjecting ? 1 : 0.94 + (Math.abs(rawOffset) / THRESHOLD) * 0.06;
  const nextTranslateY = isEjecting ? 0 : 14 - (Math.abs(rawOffset) / THRESHOLD) * 14;

  return (
    <div className="relative w-full" style={{ height: "min(58vh, 500px)" }}>
      {/* Next card — scales up as current ejects */}
      {nextProduct && (
        <div
          className="absolute inset-0 rounded-sm overflow-hidden"
          style={{
            transform: `scale(${nextScale}) translateY(${nextTranslateY}px)`,
            transition: isEjecting ? "transform 320ms cubic-bezier(0.4,0,0.2,1)" : isDragging ? "none" : "transform 200ms ease-out",
            zIndex: 0,
          }}
        >
          <div className="w-full h-full bg-neutral-200" />
        </div>
      )}

      {/* Current card */}
      <div
        className="absolute inset-0 select-none touch-none"
        style={{
          transform: `translateX(${translateX}) rotate(${rotate}deg)`,
          transition: isEjecting
            ? "transform 320ms cubic-bezier(0.4,0,0.6,1)"
            : isDragging
            ? "none"
            : "transform 220ms ease-out",
          cursor: isEjecting ? "default" : "grab",
          zIndex: 10,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-full h-full relative overflow-hidden rounded-sm shadow-lg">
          {imageSrc.startsWith("/images/") ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
              priority
              draggable={false}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `radial-gradient(ellipse at 50% 60%, ${firstColor.hex}44, #ece9e2)` }}
            />
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />

          {/* MY TASTE badge */}
          <div
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full pointer-events-none"
            style={{
              opacity: likeOpacity,
              transform: `scale(${0.82 + likeOpacity * 0.18})`,
              transition: isDragging ? "none" : "opacity 160ms, transform 160ms",
            }}
          >
            <span className="text-rose-500 text-sm">♥</span>
            <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-charcoal">My Taste</span>
          </div>

          {/* NOT FOR ME badge */}
          <div
            className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-full pointer-events-none"
            style={{
              opacity: passOpacity,
              transform: `scale(${0.82 + passOpacity * 0.18})`,
              transition: isDragging ? "none" : "opacity 160ms, transform 160ms",
            }}
          >
            <span className="text-neutral-400 text-sm font-bold">✕</span>
            <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-neutral-500">Not for me</span>
          </div>

          {/* Product info */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-5 text-white pointer-events-none">
            <p className="text-[10px] uppercase tracking-[1.5px] text-white/60 mb-1">
              {product.productCategory}
            </p>
            <h3 className="text-[18px] font-medium leading-tight mb-0.5">{product.name}</h3>
            <p className="text-[12px] text-white/55">
              {firstColor.name} · {product.type}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SwipeDeck ────────────────────────────────────────────────────────────────

export function SwipeDeck() {
  const { closeDeck, recordSwipe, resetProfile, swipeCount, topClusters, profile } = useTasteProfile();
  const [deckProducts] = useState<Product[]>(() => loadDeckProducts());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ejectDir, setEjectDir] = useState<EjectDir>(null);
  const [hoverDir, setHoverDir] = useState<EjectDir>(null);
  const isAnimating = useRef(false);

  // Resume from last position
  useEffect(() => {
    const swiped = Object.keys(profile.swipes);
    const resumeAt = deckProducts.findIndex((p) => !swiped.includes(p.id));
    setCurrentIndex(resumeAt === -1 ? deckProducts.length : resumeAt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDeck();
      if (e.key === "ArrowRight") triggerButtonEject("right");
      if (e.key === "ArrowLeft") triggerButtonEject("left");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Button-driven eject — animates card out, then advances
  function triggerButtonEject(dir: "right" | "left") {
    if (isAnimating.current) return;
    const product = deckProducts[currentIndex];
    if (!product) return;
    isAnimating.current = true;
    setHoverDir(null);
    setEjectDir(dir);
    setTimeout(() => {
      const direction = dir === "right" ? "like" : "pass";
      recordSwipe(product.id, direction, getProductClusters(product));
      setCurrentIndex((i) => i + 1);
      setEjectDir(null);
      isAnimating.current = false;
    }, 330);
  }

  // Drag-driven swipe — card handles its own animation, just record + advance
  function handleDragSwipe(direction: "like" | "pass") {
    const product = deckProducts[currentIndex];
    if (!product) return;
    recordSwipe(product.id, direction, getProductClusters(product));
    setCurrentIndex((i) => i + 1);
  }

  function handleRediscover() {
    resetProfile();
    setCurrentIndex(0);
    setEjectDir(null);
    setHoverDir(null);
    isAnimating.current = false;
  }

  const total = deckProducts.length;
  const progress = Math.round((currentIndex / total) * 100);
  const isDone = currentIndex >= total;
  const currentProduct = deckProducts[currentIndex];
  const nextProduct = deckProducts[currentIndex + 1];

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f2ed] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-6 py-4 gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[2px] text-neutral-500 mb-1.5">
            Your Style Profile: {progress}% Ready
          </p>
          <div className="h-[2px] bg-neutral-200 overflow-hidden rounded-full">
            <div
              className="h-full bg-charcoal transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] font-medium text-neutral-400 tabular-nums w-8 text-right">
          {progress}%
        </span>
        <button
          onClick={closeDeck}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 transition-colors"
          aria-label="Zamknij"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 overflow-hidden">
        {isDone ? (
          <SummaryScreen
            topClusters={topClusters}
            onClose={closeDeck}
            swipeCount={swipeCount}
            onRediscover={handleRediscover}
          />
        ) : (
          <>
            <div className="w-full max-w-[360px]">
              {currentProduct && (
                <SwipeCard
                  key={`${currentProduct.id}-${currentIndex}`}
                  product={currentProduct}
                  nextProduct={nextProduct}
                  ejectDir={ejectDir}
                  hoverDir={hoverDir}
                  onDragSwipe={handleDragSwipe}
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-5 mt-7">
              {/* Pass button */}
              <button
                onClick={() => triggerButtonEject("left")}
                onMouseEnter={() => setHoverDir("left")}
                onMouseLeave={() => setHoverDir(null)}
                className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-400 hover:shadow-md active:scale-90 transition-all duration-150"
                aria-label="Not for me"
              >
                <span className="text-lg font-bold">✕</span>
              </button>

              {/* Like button */}
              <button
                onClick={() => triggerButtonEject("right")}
                onMouseEnter={() => setHoverDir("right")}
                onMouseLeave={() => setHoverDir(null)}
                className="w-14 h-14 rounded-full bg-charcoal shadow-sm flex items-center justify-center text-white hover:shadow-md active:scale-90 transition-all duration-150"
                aria-label="My taste"
              >
                <span className="text-lg">♥</span>
              </button>
            </div>

            <p className="text-[10px] text-neutral-400 uppercase tracking-[1.5px] mt-4">
              Swipe right to like · left to pass · or use arrow keys
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function SummaryScreen({
  topClusters,
  onClose,
  swipeCount,
  onRediscover,
}: {
  topClusters: string[];
  onClose: () => void;
  swipeCount: number;
  onRediscover: () => void;
}) {
  return (
    <div className="text-center max-w-sm px-4">
      <p className="text-[10px] uppercase tracking-[2px] text-neutral-500 mb-5">Your Style</p>

      <div className="space-y-2 mb-6">
        {topClusters.length > 0 ? (
          topClusters.map((c, i) => (
            <div key={c}>
              <h2 className={`font-medium uppercase tracking-[1px] ${i === 0 ? "text-3xl" : "text-xl text-neutral-400"}`}>
                {CLUSTER_LABELS[c as keyof typeof CLUSTER_LABELS] ?? c}
              </h2>
            </div>
          ))
        ) : (
          <h2 className="text-3xl font-medium uppercase tracking-[1px]">Minimal Classic</h2>
        )}
      </div>

      <p className="text-[12px] text-neutral-500 mb-8 leading-relaxed">
        Based on {swipeCount} choices, we&apos;ve matched recommendations to your style.
      </p>

      <button
        onClick={onClose}
        className="w-full bg-charcoal text-white text-[11px] uppercase tracking-[1.5px] py-3.5 rounded-full hover:bg-black transition-colors mb-3"
      >
        See your recommendations
      </button>

      <button
        onClick={onRediscover}
        className="w-full text-[11px] uppercase tracking-[1.5px] text-neutral-400 py-2 hover:text-charcoal transition-colors"
      >
        Re-discover your style
      </button>
    </div>
  );
}
