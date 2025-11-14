import Business from '../model/business';

const store = async (businessData: any) => {
  const business = new Business(businessData);
  return business.save();
};

const findByName = async (name: string) => {
  return Business.findOne({
    name: new RegExp(`^${name}$`, 'i'), // Case insensitive
    isActive: true,
  });
};

const getBusinessById = async (businessId: string, userId: string) => {
  const business = await Business.findOne({
    _id: businessId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  if (!business) {
    throw new Error('Business not found or access denied');
  }

  return business;
};

const updateBusiness = async (businessId: string, userId: string, updateData: any) => {
  // Only allow updating specific fields for security
  const allowedFields = {
    name: updateData.name,
    email: updateData.email,
    description: updateData.description,
    categories: updateData.categories,
    businessAddress: updateData.businessAddress,
    abn: updateData.abn,
    website: updateData.website,
    facebookUrl: updateData.facebookUrl,
    twitterUrl: updateData.twitterUrl,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const business = await Business.findOneAndUpdate(
    {
      _id: businessId,
      owner: userId, // Only owner can update business info
    },
    filteredData,
    { new: true, runValidators: true },
  );

  if (!business) {
    throw new Error('Business not found or you do not have permission to update it');
  }

  return business;
};

export default {
  store,
  findByName,
  getBusinessById,
  updateBusiness,
};

