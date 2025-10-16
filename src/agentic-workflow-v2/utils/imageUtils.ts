// utils/imageUtils.ts - Image Fetching Utilities (Mocked for now)

/**
 * Placeholder image categories for different content types
 */
const PLACEHOLDER_IMAGES = {
  business: [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
  ],
  people: [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80",
  ],
  nature: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
  ],
  abstract: [
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&q=80",
    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&q=80",
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
  ],
  data: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
  ],
  education: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80",
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80",
    "https://images.unsplash.com/photo-1557683304-673a23048d34?w=1200&q=80",
  ],
};

/**
 * Categorize image query to select appropriate placeholder
 */
function categorizeQuery(query: string): keyof typeof PLACEHOLDER_IMAGES {
  const lowercaseQuery = query.toLowerCase();
  
  if (lowercaseQuery.includes("business") || lowercaseQuery.includes("office") || lowercaseQuery.includes("corporate")) {
    return "business";
  }
  if (lowercaseQuery.includes("tech") || lowercaseQuery.includes("computer") || lowercaseQuery.includes("digital")) {
    return "technology";
  }
  if (lowercaseQuery.includes("people") || lowercaseQuery.includes("team") || lowercaseQuery.includes("group")) {
    return "people";
  }
  if (lowercaseQuery.includes("nature") || lowercaseQuery.includes("landscape") || lowercaseQuery.includes("outdoor")) {
    return "nature";
  }
  if (lowercaseQuery.includes("abstract") || lowercaseQuery.includes("pattern") || lowercaseQuery.includes("texture")) {
    return "abstract";
  }
  if (lowercaseQuery.includes("data") || lowercaseQuery.includes("chart") || lowercaseQuery.includes("graph")) {
    return "data";
  }
  if (lowercaseQuery.includes("education") || lowercaseQuery.includes("learning") || lowercaseQuery.includes("study")) {
    return "education";
  }
  
  return "default";
}

/**
 * Mock image fetching - returns placeholder images based on query
 * In production, this would call Unsplash API
 */
export async function fetchImageForQuery(
  query: string,
  index: number = 0
): Promise<{ url: string; altText: string }> {
  console.log(`🖼️  Fetching image for query: "${query}"`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const category = categorizeQuery(query);
  const images = PLACEHOLDER_IMAGES[category];
  
  // Select image based on index to ensure variety
  const imageUrl = images[index % images.length];
  
  console.log(`✅ Selected ${category} image: ${imageUrl.substring(0, 50)}...`);
  
  return {
    url: imageUrl,
    altText: query,
  };
}

/**
 * Batch fetch images for multiple queries
 */
export async function fetchImagesForQueries(
  queries: Array<{ query: string; altText: string }>
): Promise<Array<{ url: string; altText: string }>> {
  console.log(`🖼️  Batch fetching ${queries.length} images...`);
  
  const results = await Promise.all(
    queries.map((q, index) => fetchImageForQuery(q.query, index))
  );
  
  // Merge with original alt text
  return results.map((result, i) => ({
    url: result.url,
    altText: queries[i].altText,
  }));
}

/**
 * Validate image URL (basic check)
 */
export function validateImageUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Get default fallback image
 */
export function getDefaultImage(): string {
  return PLACEHOLDER_IMAGES.default[0];
}
