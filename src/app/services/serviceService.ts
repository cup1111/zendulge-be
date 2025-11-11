import Service from '../model/service';
import Company from '../model/company';
import Deal from '../model/deal';
import { ConflictException } from '../exceptions';

const getServicesByCompany = async (companyId: string, userId: string) => {
  // Verify user has access to the company
  const company = await Company.findOne({
    _id: companyId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  if (!company) {
    throw new Error('Company not found or access denied');
  }

  // Get all services for the company
  const services = await Service.find({ company: companyId });
  return services;
};

const getServiceById = async (companyId: string, serviceId: string, userId: string) => {
  // Verify user has access to the company
  const company = await Company.findOne({
    _id: companyId,
    $or: [
      { owner: userId },
      { 'members.user': userId },
    ],
  });

  if (!company) {
    throw new Error('Company not found or access denied');
  }

  const service = await Service.findOne({
    _id: serviceId,
    company: companyId,
  });

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

const createService = async (companyId: string, userId: string, serviceData: any) => {
  // Verify user is owner of the company
  const company = await Company.findOne({
    _id: companyId,
    owner: userId,
  });

  if (!company) {
    throw new Error('Company not found or you do not have permission to create services');
  }

  // Only allow updating specific fields for security
  const allowedFields = {
    name: serviceData.name,
    category: serviceData.category,
    duration: serviceData.duration,
    basePrice: serviceData.basePrice,
    description: serviceData.description,
    status: serviceData.status || 'active',
    company: companyId,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const service = new Service(filteredData);
  await service.save();

  return service;
};

const updateService = async (companyId: string, serviceId: string, userId: string, updateData: any) => {
  // Verify user is owner of the company
  const company = await Company.findOne({
    _id: companyId,
    owner: userId,
  });

  if (!company) {
    throw new Error('Company not found or you do not have permission to update services');
  }

  // Only allow updating specific fields for security
  const allowedFields = {
    name: updateData.name,
    category: updateData.category,
    duration: updateData.duration,
    basePrice: updateData.basePrice,
    description: updateData.description,
    status: updateData.status,
  };

  // Remove undefined values
  const filteredData = Object.fromEntries(
    Object.entries(allowedFields).filter(([, value]) => value !== undefined),
  );

  const service = await Service.findOneAndUpdate(
    {
      _id: serviceId,
      company: companyId,
    },
    filteredData,
    { new: true, runValidators: true },
  );

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

const deleteService = async (companyId: string, serviceId: string, userId: string) => {
  // Verify user is owner of the company
  const company = await Company.findOne({
    _id: companyId,
    owner: userId,
  });

  if (!company) {
    throw new Error('Company not found or you do not have permission to delete services');
  }

  const hasRelatedDeals = await Deal.exists({
    company: companyId,
    service: serviceId,
  });

  if (hasRelatedDeals) {
    throw new ConflictException(
      'This service is in use by existing deals. Please update or remove those deals before deleting it.',
    );
  }

  const service = await Service.findOneAndDelete({
    _id: serviceId,
    company: companyId,
  });

  if (!service) {
    throw new Error('Service not found');
  }

  return service;
};

export default {
  getServicesByCompany,
  getServiceById,
  createService,
  updateService,
  deleteService,
};