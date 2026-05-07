"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { StyleCluster } from "@/types";

export type SwipeDirection = "like" | "pass";

export interface TasteProfile {
  swipes: Record<string, SwipeDirection>;
  clusters: Record<StyleCluster, number>;
}

interface TasteProfileContextType {
  profile: TasteProfile;
  swipeCount: number;
  hasEnoughSwipes: boolean;
  isComplete: boolean;
  topClusters: StyleCluster[];
  recordSwipe: (productId: string, direction: SwipeDirection, clusters: StyleCluster[]) => void;
  resetProfile: () => void;
  openDeck: () => void;
  closeDeck: () => void;
  isDeckOpen: boolean;
  toastVisible: boolean;
}

const STORAGE_KEY = "fh_taste_profile";
const MIN_SWIPES_FOR_PERSONALIZATION = 6;
const DECK_SIZE = 10;

const emptyProfile = (): TasteProfile => ({
  swipes: {},
  clusters: {
    "romantic-feminine": 0,
    "streetwear-urban": 0,
    "minimal-classic": 0,
    "boho-natural": 0,
    "party-glam": 0,
    "smart-casual": 0,
  },
});

const TasteProfileContext = createContext<TasteProfileContextType | null>(null);

export function useTasteProfile() {
  const ctx = useContext(TasteProfileContext);
  if (!ctx) throw new Error("useTasteProfile must be used within TasteProfileProvider");
  return ctx;
}

export function TasteProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<TasteProfile>(emptyProfile);
  const [isDeckOpen, setIsDeckOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(JSON.parse(raw) as TasteProfile);
    } catch { /* ignore */ }
  }, []);

  const swipeCount = Object.keys(profile.swipes).length;
  const hasEnoughSwipes = swipeCount >= MIN_SWIPES_FOR_PERSONALIZATION;
  const isComplete = swipeCount >= DECK_SIZE;

  const topClusters = (
    Object.entries(profile.clusters) as [StyleCluster, number][]
  )
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0)
    .map(([cluster]) => cluster)
    .slice(0, 2);

  const recordSwipe = useCallback(
    (productId: string, direction: SwipeDirection, clusters: StyleCluster[]) => {
      setProfile((prev) => {
        const newSwipes = { ...prev.swipes, [productId]: direction };
        const newClusters = { ...prev.clusters };

        if (direction === "like") {
          for (const c of clusters) {
            newClusters[c] = (newClusters[c] ?? 0) + 1;
          }
        }

        const next: TasteProfile = { swipes: newSwipes, clusters: newClusters };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }

        const newCount = Object.keys(newSwipes).length;
        if (newCount === MIN_SWIPES_FOR_PERSONALIZATION) {
          if (toastTimer.current) clearTimeout(toastTimer.current);
          setToastVisible(true);
          toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
        }

        return next;
      });
    },
    []
  );

  const resetProfile = useCallback(() => {
    const fresh = emptyProfile();
    setProfile(fresh);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch { /* ignore */ }
  }, []);

  const openDeck = useCallback(() => setIsDeckOpen(true), []);
  const closeDeck = useCallback(() => setIsDeckOpen(false), []);

  return (
    <TasteProfileContext.Provider
      value={{
        profile,
        swipeCount,
        hasEnoughSwipes,
        isComplete,
        topClusters,
        recordSwipe,
        resetProfile,
        openDeck,
        closeDeck,
        isDeckOpen,
        toastVisible,
      }}
    >
      {children}
    </TasteProfileContext.Provider>
  );
}
