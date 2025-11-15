import Business from '../model/business';
import Deal from '../model/deal';
import { BusinessStatus } from '../enum/businessStatus';

const store = async (businessData: any) => {
  const business = new Business(businessData);
  return business.save();
};

const findByName = async (name: string) => {
  return Business.findOne({
    name: new RegExp(`^${name}$`, 'i'), // Case insensitive
    status: BusinessStatus.ACTIVE,
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
  // Get existing business to check for ABN changes
  const existingBusiness = await Business.findOne({
    _id: businessId,
    owner: userId, // Only owner can update business info
  });

  if (!existingBusiness) {
    throw new Error('Business not found or you do not have permission to update it');
  }

  // Check if ABN is being changed
  const abnChanged = updateData.abn &&
    existingBusiness.abn &&
    updateData.abn.replace(/\s/g, '').toUpperCase() !== existingBusiness.abn.replace(/\s/g, '').toUpperCase();

  // Only allow updating specific fields for security
  const allowedFields: any = {
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

  // If ABN changed, set status to 'pending' (will need re-verification) and disable all deals
  if (abnChanged) {
    allowedFields.status = BusinessStatus.PENDING;
    // Disable all active deals for this business
    await Deal.updateMany(
      { business: businessId, status: 'active' },
      { status: 'inactive' }
    );
  }

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const business = await Business.findOneAndUpdate(
    {
      _id: businessId,
      owner: userId,
    },
    filteredData,
    { new: true, runValidators: true },
  );

  if (!business) {
    throw new Error('Business not found or you do not have permission to update it');
  }

  return { business, abnChanged };
};

export default {
  store,
  findByName,
  getBusinessById,
  updateBusiness,
};

