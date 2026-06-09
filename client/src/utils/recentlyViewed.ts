const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 12;

export function getRecentlyViewedProductIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberViewedProduct(productId: string) {
  const ids = getRecentlyViewedProductIds().filter((id) => id !== productId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([productId, ...ids].slice(0, MAX_ITEMS)));
}
