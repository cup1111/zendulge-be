import Company from '../model/company';
import User from '../model/user';
import { RoleName } from '../enum/roles';
import { Types } from 'mongoose';

/**
 * Get all customers for a company
 * Only accessible by owners and managers
 */
const getCustomersByCompany = async (companyId: string, userId: string) => {
    // Get company and populate members
    const company = await Company.findById(companyId)
        .populate('members.user')
        .populate('members.role');

    if (!company) {
        throw new Error('Company not found');
    }

    // Check if user is owner
    const isOwner = company.isCompanyOwner(new Types.ObjectId(userId));

    // Check if user is manager
    let isManager = false;
    if (!isOwner && company.members) {
        const member = company.members.find(
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
    const companyWithCustomers = await Company.findById(companyId)
        .populate({
            path: 'customers',
            select: 'firstName lastName email phoneNumber active',
        })
        .lean();

    return companyWithCustomers?.customers || [];
};

/**
 * Add a customer to a company
 * Only accessible by owners and managers
 */
const addCustomerToCompany = async (
    companyId: string,
    userId: string,
    customerId: string,
) => {
    // Get company and check permissions
    const company = await Company.findById(companyId)
        .populate('members.role');

    if (!company) {
        throw new Error('Company not found');
    }

    // Check if user is owner
    const isOwner = company.isCompanyOwner(new Types.ObjectId(userId));

    // Check if user is manager
    let isManager = false;
    if (!isOwner && company.members) {
        const member = company.members.find(
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
    const existingCustomers = company.customers || [];
    const isAlreadyAdded = existingCustomers.some(
        (id: any) => id.toString() === customerId,
    );

    if (isAlreadyAdded) {
        throw new Error('Customer is already added to this company');
    }

    // Add customer to company
    company.customers = [...existingCustomers, new Types.ObjectId(customerId)];
    await company.save();

    // Populate and return the customer
    const customerData = await User.findById(customerId)
        .select('firstName lastName email phoneNumber active')
        .lean();

    return customerData;
};

/**
 * Remove a customer from a company
 * Only accessible by owners and managers
 */
const removeCustomerFromCompany = async (
    companyId: string,
    userId: string,
    customerId: string,
) => {
    // Get company and check permissions
    const company = await Company.findById(companyId)
        .populate('members.role');

    if (!company) {
        throw new Error('Company not found');
    }

    // Check if user is owner
    const isOwner = company.isCompanyOwner(new Types.ObjectId(userId));

    // Check if user is manager
    let isManager = false;
    if (!isOwner && company.members) {
        const member = company.members.find(
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

    // Remove customer from company
    const existingCustomers = company.customers || [];
    company.customers = existingCustomers.filter(
        (id: any) => id.toString() !== customerId,
    );
    await company.save();

    return { success: true, message: 'Customer removed successfully' };
};

export default {
    getCustomersByCompany,
    addCustomerToCompany,
    removeCustomerFromCompany,
};
