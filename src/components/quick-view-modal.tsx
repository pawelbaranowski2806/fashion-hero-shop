"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import posthog from "posthog-js";
import type { Product, ProductColor } from "@/types";
import { CloseIcon } from "./icons";
import { ColorSwatches } from "./color-swatches";
import { SizeSelector } from "./size-selector";
import { useCart } from "./cart-provider";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

function productGradient(hex: string): string {
  return `radial-gradient(ellipse at 50% 60%, ${hex}33 0%, ${hex}11 40%, #ece9e2 70%)`;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const { addItem } = useCart();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Focus trap — focus the dialog
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleAddToCart() {
    if (!selectedSize) return;
    addItem(product, selectedColor, selectedSize);
    posthog.capture("product_added_to_cart", {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_category: product.category,
      product_price: product.price,
      color: selectedColor.name,
      size: selectedSize,
      source: "quick_view",
    });
    onClose();
  }

  const imageSrc = selectedColor.image;
  const showImage = imageSrc.startsWith("/images/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10 outline-none"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:opacity-60 transition-opacity z-10"
          aria-label="Close quick view"
        >
          <CloseIcon />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div
            className="relative aspect-square"
            style={{ background: productGradient(selectedColor.hex) }}
          >
            {showImage ? (
              <Image
                src={imageSrc}
                alt={`${product.name} - ${selectedColor.name}`}
                width={800}
                height={800}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-3/5 h-2/5">
                  <div
                    className="absolute inset-0 rounded-[50%]"
                    style={{
                      background: `linear-gradient(135deg, ${selectedColor.hex}88 0%, ${selectedColor.hex}44 100%)`,
                      transform: "rotate(-8deg) scaleX(1.6)",
                    }}
                  />
                  <div
                    className="absolute top-[-20%] left-[10%] w-[50%] h-[70%] rounded-[40%_60%_30%_70%]"
                    style={{
                      background: `linear-gradient(180deg, ${selectedColor.hex}66 0%, ${selectedColor.hex}33 100%)`,
                      transform: "rotate(-15deg)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col gap-4">
            <h2 className="text-xl font-normal text-charcoal">{product.name}</h2>

            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-charcoal">{product.price} zl</span>
              {product.originalPrice && (
                <span className="text-sm text-warm-gray line-through">
                  {product.originalPrice} zl
                </span>
              )}
            </div>

            <ColorSwatches
              colors={product.colors}
              selectedColor={selectedColor}
              onSelect={setSelectedColor}
            />

            <SizeSelector
              sizes={product.sizes}
              selectedSize={selectedSize}
              onSelect={setSelectedSize}
            />

            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="w-full py-3.5 bg-charcoal text-white text-[12px] font-medium uppercase tracking-[0.6px] rounded-full hover:bg-charcoal-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedSize ? "ADD TO CART - " + product.price + " zl" : "SELECT A SIZE"}
            </button>

            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-center text-[12px] font-medium uppercase tracking-[0.5px] text-charcoal underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              VIEW FULL DETAILS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
