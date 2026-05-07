"use client";

import { AnnouncementBar } from "./announcement-bar";
import { Header } from "./header";
import { Footer } from "./footer";
import { CartProvider, useCart } from "./cart-provider";
import { WishlistProvider, useWishlist } from "./wishlist-provider";
import { QuickViewProvider } from "./quick-view-provider";
import { AuthProvider } from "./auth-provider";
import { TasteProfileProvider, useTasteProfile } from "./taste-profile-provider";
import { SwipeDeck } from "./swipe-deck";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { openCart, itemCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { isDeckOpen } = useTasteProfile();

  return (
    <>
      <AnnouncementBar />
      <Header onCartOpen={openCart} cartCount={itemCount} wishlistCount={wishlistItems.length} />
      <main className="flex-1">{children}</main>
      <Footer />
      {isDeckOpen && <SwipeDeck />}
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TasteProfileProvider>
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <ShellInner>{children}</ShellInner>
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </TasteProfileProvider>
    </AuthProvider>
  );
}
