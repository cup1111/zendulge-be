import mongoose from 'mongoose';

/**
 * Builds the initial match filter for deals
 */
export const buildInitialMatchFilter = (
  nearbySiteIds: mongoose.Types.ObjectId[] | undefined,
  title?: string,
): any => {
  const match: any = {
    status: 'active',
  };

  // Apply location filter if provided
  if (nearbySiteIds !== undefined) {
    if (nearbySiteIds.length === 0) {
      // No sites within radius, so return no deals
      match.operatingSite = { $in: [] };
    } else {
      const nearbySiteIdsAsStrings = nearbySiteIds.map((id) => id.toString());
      // Use $in to match if ANY element in the operatingSite array matches
      match.operatingSite = { $in: nearbySiteIdsAsStrings };
    }
  }

  // Apply title filter if provided
  if (title) {
    match.title = { $regex: title, $options: 'i' };
  }

  return match;
};

