import { Types } from 'mongoose';
import Role from '../model/role';
import { ICompanyDocument } from '../model/company';
import { RoleName } from '../enum/roles';
import { winstonLogger } from '../../loaders/logger';

export const normalizeId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object') {
    if ('_id' in value && value._id) {
      return (value._id as Types.ObjectId).toString();
    }
    if ('id' in value && value.id) {
      return value.id.toString();
    }
  }
  try {
    return value.toString();
  } catch (error) {
    winstonLogger.warn('Unable to normalize identifier', error);
    return null;
  }
};

export const resolveRoleName = async (
  roleRef: any,
): Promise<RoleName | null> => {
  if (!roleRef) return null;
  if (typeof roleRef === 'object' && 'name' in roleRef) {
    return (roleRef.name as RoleName) ?? null;
  }

  const roleId = normalizeId(roleRef);
  if (!roleId) return null;

  const roleDoc = await Role.findById(roleId);
  return roleDoc ? (roleDoc.name as RoleName) : null;
};

export const getUserRoleName = async (
  company: ICompanyDocument | null,
  userId?: string | null,
): Promise<RoleName | null> => {
  if (!company || !userId) {
    return null;
  }

  if (normalizeId(company.owner) === userId) {
    return RoleName.OWNER;
  }

  const companyMember = company.members?.find((memberEntry) => {
    const memberUserId = normalizeId(memberEntry.user);
    return memberUserId === userId;
  });

  if (!companyMember) {
    return null;
  }

  return resolveRoleName(companyMember.role);
};

