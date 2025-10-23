/**
 * Utility functions for handling MongoDB document transformations
 */

/**
 * Transform lean query results to use 'id' instead of '_id'
 * This ensures consistency with the global Mongoose transformation
 */
export function transformLeanResult<T = any>(doc: T): T {
  if (!doc) return doc;

  if (Array.isArray(doc)) {
    return doc.map((item) => transformLeanResult(item)) as T;
  }

  if (typeof doc === 'object' && doc !== null) {
    const transformed = { ...doc } as any;

    // Transform the main document _id to id (convert ObjectId to string)
    if (transformed._id) {
      // Handle both ObjectId objects and string IDs
      transformed.id =
        typeof transformed._id === 'string'
          ? transformed._id
          : transformed._id.toString();
      delete transformed._id;
    }

    // Transform nested objects recursively
    for (const key of Object.keys(transformed)) {
      const value = transformed[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Transform arrays recursively
          transformed[key] = value.map((item: any) =>
            transformLeanResult(item),
          );
        } else {
          // Transform nested objects recursively
          transformed[key] = transformLeanResult(value);
        }
      }
    }

    // Remove MongoDB version field
    delete transformed.__v;
    return transformed as T;
  }

  return doc;
}

/**
 * Transform multiple lean query results
 */
export function transformLeanResults<T = any>(docs: T[]): T[] {
  return docs.map((doc) => transformLeanResult(doc));
}

export default {
  transformLeanResult,
  transformLeanResults,
};
