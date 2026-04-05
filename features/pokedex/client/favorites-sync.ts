"use client";

const FAVORITES_SYNC_EVENT = "kxoxxy:favorites-sync";

type FavoritesSyncDetail = {
  favoriteDexNumbers: number[];
};

export function emitFavoriteDexNumbersUpdate(favoriteDexNumbers: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<FavoritesSyncDetail>(FAVORITES_SYNC_EVENT, {
      detail: { favoriteDexNumbers },
    }),
  );
}

export function subscribeToFavoriteDexNumbersUpdate(callback: (favoriteDexNumbers: number[]) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<FavoritesSyncDetail>;
    callback(customEvent.detail?.favoriteDexNumbers ?? []);
  };

  window.addEventListener(FAVORITES_SYNC_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(FAVORITES_SYNC_EVENT, handler as EventListener);
  };
}
