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
    return doc.map(item => transformLeanResult(item)) as T;
  }
  
  if (typeof doc === 'object' && doc !== null) {
    const transformed = { ...doc } as any;
    
    if (transformed._id) {
      transformed.id = transformed._id;
      delete transformed._id;
    }
    
    delete transformed.__v;
    return transformed as T;
  }
  
  return doc;
}

/**
 * Transform multiple lean query results
 */
export function transformLeanResults<T = any>(docs: T[]): T[] {
  return docs.map(doc => transformLeanResult(doc));
}

export default {
  transformLeanResult,
  transformLeanResults,
};
