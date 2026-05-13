"use client";

import { useState, useRef, useEffect } from "react";
import posthog from "posthog-js";
import { ChevronDownIcon } from "./icons";
import type { ShoeType, ShoeMaterial } from "@/types";

type GenderFilter = "all" | "men" | "women";
type SortOption = "featured" | "price-asc" | "price-desc" | "newest";
type PriceRange = "all" | "under-100" | "100-130" | "over-130";

interface FilterBarProps {
  productCount: number;
  onFilterChange: (gender: GenderFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onShoeTypeChange: (types: ShoeType[]) => void;
  onMaterialChange: (materials: ShoeMaterial[]) => void;
  activeFilterCount: number;
}

const sortLabels: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest: "Newest",
};

const priceLabels: Record<PriceRange, string> = {
  all: "All Prices",
  "under-100": "Under 199 zl",
  "100-130": "199 - 399 zl",
  "over-130": "Over 399 zl",
};

const shoeTypeLabels: Record<ShoeType, string> = {
  runner: "Runner",
  walker: "Walker",
  "slip-on": "Slip-On",
  trainer: "Trainer",
  flat: "Flat",
  hiker: "Hiker",
  slide: "Slide",
  loafer: "Loafer",
  sock: "Sock",
  tee: "Tee",
  hoodie: "Hoodie",
  pant: "Jogger",
  jacket: "Jacket",
  cardigan: "Cardigan",
  bag: "Bag",
  beanie: "Beanie",
  cap: "Cap",
  insole: "Insole",
};

const materialLabels: Record<ShoeMaterial, string> = {
  mesh: "Mesh",
  wool: "Wool",
  "tree-fiber": "Tree Fiber",
  knit: "Knit",
  leather: "Leather",
};

const shoeTypeOptions: ShoeType[] = ["runner", "walker", "slip-on", "trainer", "flat"];
const materialOptions: ShoeMaterial[] = ["mesh", "wool", "tree-fiber", "knit"];

export function FilterBar({
  productCount,
  onFilterChange,
  onSortChange,
  onPriceRangeChange,
  onShoeTypeChange,
  onMaterialChange,
  activeFilterCount,
}: FilterBarProps) {
  const [activeGender, setActiveGender] = useState<GenderFilter>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("featured");
  const [activePriceRange, setActivePriceRange] = useState<PriceRange>("all");
  const [activeShoeTypes, setActiveShoeTypes] = useState<ShoeType[]>([]);
  const [activeMaterials, setActiveMaterials] = useState<ShoeMaterial[]>([]);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  function handleGenderChange(gender: GenderFilter) {
    setActiveGender(gender);
    onFilterChange(gender);
    posthog.capture("collection_filtered", { filter_type: "gender", value: gender });
  }

  function handleSortChange(sort: SortOption) {
    setActiveSort(sort);
    onSortChange(sort);
    setSortOpen(false);
    posthog.capture("collection_filtered", { filter_type: "sort", value: sort });
  }

  function handlePriceRangeChange(range: PriceRange) {
    const next = activePriceRange === range ? "all" : range;
    setActivePriceRange(next);
    onPriceRangeChange(next);
    posthog.capture("collection_filtered", { filter_type: "price_range", value: next });
  }

  function toggleShoeType(type: ShoeType) {
    const next = activeShoeTypes.includes(type)
      ? activeShoeTypes.filter((t) => t !== type)
      : [...activeShoeTypes, type];
    setActiveShoeTypes(next);
    onShoeTypeChange(next);
    posthog.capture("collection_filtered", { filter_type: "shoe_type", value: next });
  }

  function toggleMaterial(material: ShoeMaterial) {
    const next = activeMaterials.includes(material)
      ? activeMaterials.filter((m) => m !== material)
      : [...activeMaterials, material];
    setActiveMaterials(next);
    onMaterialChange(next);
    posthog.capture("collection_filtered", { filter_type: "material", value: next });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-20 bg-cream border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top row: filter label, gender pills, sort */}
        <div className="flex items-center justify-between">
          {/* Left: Filter count */}
          <span className="text-label">
            FILTER{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} ({productCount} products)
          </span>

          {/* Center: Gender toggle pills */}
          <div className="flex items-center gap-2">
            {(["all", "men", "women"] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => handleGenderChange(gender)}
                className={`px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full border transition-colors ${
                  activeGender === gender
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-transparent text-charcoal border-charcoal/30 hover:border-charcoal"
                }`}
              >
                {gender === "all" ? "ALL" : gender === "men" ? "MEN" : "WOMEN"}
              </button>
            ))}
          </div>

          {/* Right: Sort dropdown */}
          <div ref={sortRef} className="relative hidden sm:block">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="text-label flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity"
            >
              {sortLabels[activeSort].toUpperCase()}
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-black/10 shadow-lg rounded z-30 min-w-[180px]">
                {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
                  <button
                    key={sort}
                    onClick={() => handleSortChange(sort)}
                    className={`block w-full text-left px-4 py-2 text-xs tracking-wide transition-colors ${
                      activeSort === sort
                        ? "bg-cream font-medium text-charcoal"
                        : "text-warm-gray hover:bg-cream-light hover:text-charcoal"
                    }`}
                  >
                    {sortLabels[sort]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price range pills */}
        <div className="flex items-center gap-2 mt-3">
          {(["under-100", "100-130", "over-130"] as const).map((range) => (
            <button
              key={range}
              onClick={() => handlePriceRangeChange(range)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full border transition-colors ${
                activePriceRange === range
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-transparent text-charcoal border-charcoal/30 hover:border-charcoal"
              }`}
            >
              {priceLabels[range]}
            </button>
          ))}
        </div>

        {/* Shoe type pills */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-warm-gray mr-1">Type:</span>
          {shoeTypeOptions.map((type) => (
            <button
              key={type}
              onClick={() => toggleShoeType(type)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full border transition-colors ${
                activeShoeTypes.includes(type)
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-transparent text-charcoal border-charcoal/30 hover:border-charcoal"
              }`}
            >
              {shoeTypeLabels[type]}
            </button>
          ))}
        </div>

        {/* Material pills */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-warm-gray mr-1">Material:</span>
          {materialOptions.map((material) => (
            <button
              key={material}
              onClick={() => toggleMaterial(material)}
              className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full border transition-colors ${
                activeMaterials.includes(material)
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-transparent text-charcoal border-charcoal/30 hover:border-charcoal"
              }`}
            >
              {materialLabels[material]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { GenderFilter, SortOption, PriceRange };
