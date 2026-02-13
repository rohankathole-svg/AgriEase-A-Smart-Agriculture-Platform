const FALLBACK_IMAGES = {
  product:
    "https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg?auto=compress&cs=tinysrgb&w=1200",
  equipment:
    "https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=1200",
  crop: "https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1200",
  avatar:
    "https://images.pexels.com/photos/532568/pexels-photo-532568.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export function getFallbackImage(kind = "product") {
  return FALLBACK_IMAGES[kind] || FALLBACK_IMAGES.product;
}

export function getSafeImageUrl(url, kind = "product") {
  if (typeof url !== "string") {
    return getFallbackImage(kind);
  }
  const normalized = url.trim();
  if (!normalized || normalized.toLowerCase() === "null") {
    return getFallbackImage(kind);
  }
  return normalized;
}

export function onImageError(kind = "product") {
  return (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === "1") {
      return;
    }
    img.dataset.fallbackApplied = "1";
    img.src = getFallbackImage(kind);
  };
}
