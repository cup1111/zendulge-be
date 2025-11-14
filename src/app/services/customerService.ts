import Business from '../model/business';
import User from '../model/user';
import { RoleName } from '../enum/roles';
import { Types } from 'mongoose';

/**
 * Get all customers for a business
 * Only accessible by owners and managers
 */
const getCustomersByBusiness = async (businessId: string, userId: string) => {
  // Get business and populate members
  const business = await Business.findById(businessId)
    .populate('members.user')
    .populate('members.role');

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if user is owner
  const isOwner = business.isBusinessOwner(new Types.ObjectId(userId));

  // Check if user is manager
  let isManager = false;
  if (!isOwner && business.members) {
    const member = business.members.find(
      (m: any) => m.user._id.toString() === userId,
    );
    if (member?.role) {
      const role = member.role as any;
      isManager = role.name === RoleName.MANAGER;
    }
  }

  if (!isOwner && !isManager) {
    throw new Error('Only owners and managers can view customers');
  }

  // Get customers
  const businessWithCustomers = await Business.findById(businessId)
    .populate({
      path: 'customers',
      select: 'firstName lastName email phoneNumber active',
    })
    .lean();

  return businessWithCustomers?.customers || [];
};

/**
 * Add a customer to a business
 * Only accessible by owners and managers
 */
const addCustomerToBusiness = async (
  businessId: string,
  userId: string,
  customerId: string,
) => {
  // Get business and check permissions
  const business = await Business.findById(businessId)
    .populate('members.role');

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if user is owner
  const isOwner = business.isBusinessOwner(new Types.ObjectId(userId));

  // Check if user is manager
  let isManager = false;
  if (!isOwner && business.members) {
    const member = business.members.find(
      (m: any) => m.user.toString() === userId,
    );
    if (member?.role) {
      const role = member.role as any;
      isManager = role.name === RoleName.MANAGER;
    }
  }

  if (!isOwner && !isManager) {
    throw new Error('Only owners and managers can add customers');
  }

  // Verify customer exists
  const customer = await User.findById(customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Check if customer is already added
  const existingCustomers = business.customers || [];
  const isAlreadyAdded = existingCustomers.some(
    (id: any) => id.toString() === customerId,
  );

  if (isAlreadyAdded) {
    throw new Error('Customer is already added to this business');
  }

  // Add customer to business
  business.customers = [...existingCustomers, new Types.ObjectId(customerId)];
  await business.save();

  // Populate and return the customer
  const customerData = await User.findById(customerId)
    .select('firstName lastName email phoneNumber active')
    .lean();

  return customerData;
};

/**
 * Remove a customer from a business
 * Only accessible by owners and managers
 */
const removeCustomerFromBusiness = async (
  businessId: string,
  userId: string,
  customerId: string,
) => {
  // Get business and check permissions
  const business = await Business.findById(businessId)
    .populate('members.role');

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if user is owner
  const isOwner = business.isBusinessOwner(new Types.ObjectId(userId));

  // Check if user is manager
  let isManager = false;
  if (!isOwner && business.members) {
    const member = business.members.find(
      (m: any) => m.user.toString() === userId,
    );
    if (member?.role) {
      const role = member.role as any;
      isManager = role.name === RoleName.MANAGER;
    }
  }

  if (!isOwner && !isManager) {
    throw new Error('Only owners and managers can remove customers');
  }

  // Remove customer from business
  const existingCustomers = business.customers || [];
  business.customers = existingCustomers.filter(
    (id: any) => id.toString() !== customerId,
  );
  await business.save();

  return { success: true, message: 'Customer removed successfully' };
};

export default {
  getCustomersByBusiness,
  addCustomerToBusiness,
  removeCustomerFromBusiness,
};
