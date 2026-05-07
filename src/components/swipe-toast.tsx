"use client";

import { useTasteProfile } from "./taste-profile-provider";

export function SwipeToast() {
  const { toastVisible } = useTasteProfile();

  if (!toastVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-charcoal text-white text-[11px] uppercase tracking-[1.5px] px-6 py-3 shadow-lg">
        Your recommendations are ready!
      </div>
    </div>
  );
}
