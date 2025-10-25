import Company from '../model/company';
import { Types } from 'mongoose';

const store = async (companyData: any) => {
  const company = new Company(companyData);
  return company.save();
};

const findByName = async (name: string) => {
  return Company.findOne({
    name: new RegExp(`^${name}$`, 'i'), // Case insensitive
    isActive: true,
  });
};

const getCompanyById = async (companyId: string, userId: string) => {
  const company = await Company.findOne({
    _id: companyId,
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  });

  if (!company) {
    throw new Error('Company not found or access denied');
  }

  return company;
};

const updateCompany = async (companyId: string, userId: string, updateData: any) => {
  // Only allow updating specific fields for security
  const allowedFields = {
    name: updateData.name,
    email: updateData.email,
    description: updateData.description,
    serviceCategory: updateData.serviceCategory,
    businessAddress: updateData.businessAddress,
    abn: updateData.abn,
    website: updateData.website,
    facebookUrl: updateData.facebookUrl,
    twitterUrl: updateData.twitterUrl,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
  );

  const company = await Company.findOneAndUpdate(
    {
      _id: companyId,
      owner: userId, // Only owner can update company info
    },
    filteredData,
    { new: true, runValidators: true }
  );

  if (!company) {
    throw new Error('Company not found or you do not have permission to update it');
  }

  return company;
};

export default {
  store,
  findByName,
  getCompanyById,
  updateCompany,
};
