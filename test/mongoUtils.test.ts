import { transformLeanResult } from '../src/lib/mongoUtils';
import { Types } from 'mongoose';

describe('transformLeanResult', () => {
  describe('Basic transformation', () => {
    it('should return null/undefined as is', () => {
      expect(transformLeanResult(null)).toBeNull();
      expect(transformLeanResult(undefined)).toBeUndefined();
    });

    it('should return primitive values as is', () => {
      expect(transformLeanResult('string')).toBe('string');
      expect(transformLeanResult(123)).toBe(123);
      expect(transformLeanResult(true)).toBe(true);
    });

    it('should transform _id to id with ObjectId', () => {
      const objectId = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const doc = { _id: objectId, name: 'Test' };
      
      const result: any = transformLeanResult(doc);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa38',
        name: 'Test',
      });
      expect(result._id).toBeUndefined();
      expect(typeof result.id).toBe('string');
    });

    it('should transform _id to id with string', () => {
      const doc = { _id: '68ef86207cff14ca10c2fa38', name: 'Test' };
      
      const result: any = transformLeanResult(doc);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa38',
        name: 'Test',
      });
      expect(result._id).toBeUndefined();
      expect(typeof result.id).toBe('string');
    });

    it('should remove __v field', () => {
      const doc = { _id: '68ef86207cff14ca10c2fa38', name: 'Test', __v: 0 };
      
      const result: any = transformLeanResult(doc);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa38',
        name: 'Test',
      });
      expect(result.__v).toBeUndefined();
    });
  });

  describe('Array transformation', () => {
    it('should transform array of documents', () => {
      const objectId1 = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const objectId2 = new Types.ObjectId('68ef86207cff14ca10c2fa39');
      
      const docs = [
        { _id: objectId1, name: 'Company 1' },
        { _id: objectId2, name: 'Company 2' },
      ];
      
      const result: any = transformLeanResult(docs);
      
      expect(result).toEqual([
        { id: '68ef86207cff14ca10c2fa38', name: 'Company 1' },
        { id: '68ef86207cff14ca10c2fa39', name: 'Company 2' },
      ]);
      
      // Ensure all IDs are strings
      result.forEach((item: any) => {
        expect(typeof item.id).toBe('string');
        expect(item._id).toBeUndefined();
      });
    });

    it('should handle empty array', () => {
      const result = transformLeanResult([]);
      expect(result).toEqual([]);
    });
  });

  describe('Nested object transformation', () => {
    it('should transform nested objects with _id', () => {
      const companyId = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const userId = new Types.ObjectId('68ef86207cff14ca10c2fa33');
      
      const doc = {
        _id: userId,
        name: 'User',
        company: {
          _id: companyId,
          name: 'Company',
        },
      };
      
      const result: any = transformLeanResult(doc);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa33',
        name: 'User',
        company: {
          id: '68ef86207cff14ca10c2fa38',
          name: 'Company',
        },
      });
      
      expect(typeof result.id).toBe('string');
      expect(typeof result.company.id).toBe('string');
      expect(result._id).toBeUndefined();
      expect(result.company._id).toBeUndefined();
    });

    it('should transform nested arrays', () => {
      const userId = new Types.ObjectId('68ef86207cff14ca10c2fa33');
      const companyId1 = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const companyId2 = new Types.ObjectId('68ef86207cff14ca10c2fa39');
      
      const doc = {
        _id: userId,
        name: 'User',
        companies: [
          { _id: companyId1, name: 'Company 1' },
          { _id: companyId2, name: 'Company 2' },
        ],
      };
      
      const result: any = transformLeanResult(doc);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa33',
        name: 'User',
        companies: [
          { id: '68ef86207cff14ca10c2fa38', name: 'Company 1' },
          { id: '68ef86207cff14ca10c2fa39', name: 'Company 2' },
        ],
      });
      
      expect(typeof result.id).toBe('string');
      result.companies.forEach((company: any) => {
        expect(typeof company.id).toBe('string');
        expect(company._id).toBeUndefined();
      });
    });
  });

  describe('Real-world MongoDB lean result scenarios', () => {
    it('should handle company query result (the bug scenario)', () => {
      // This simulates the exact scenario that was causing the bug
      const companyId = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const leanResult = {
        _id: companyId,
        name: 'Zendulge Technologies Pty Ltd',
        isActive: true,
        __v: 0,
      };
      
      const result: any = transformLeanResult(leanResult);
      
      expect(result).toEqual({
        id: '68ef86207cff14ca10c2fa38',
        name: 'Zendulge Technologies Pty Ltd',
        isActive: true,
      });
      
      // Critical: ID must be a string, not an object
      expect(typeof result.id).toBe('string');
      expect(result.id).toBe('68ef86207cff14ca10c2fa38');
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
    });

    it('should handle array of companies from user.generateAuthToken', () => {
      // This simulates the exact query from user.generateAuthToken
      const company1Id = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const company2Id = new Types.ObjectId('68ef86207cff14ca10c2fa39');
      
      const userCompaniesLeanResult = [
        {
          _id: company1Id,
          name: 'Zendulge Technologies Pty Ltd',
          __v: 0,
        },
        {
          _id: company2Id,
          name: 'Another Company Ltd',
          __v: 0,
        },
      ];
      
      const transformedCompanies: any = transformLeanResult(userCompaniesLeanResult);
      
      // This should work without any fallback logic in user.ts
      const companies = transformedCompanies.map((c: any) => ({ 
        id: c.id, 
        name: c.name,
      }));
      
      expect(companies).toEqual([
        { id: '68ef86207cff14ca10c2fa38', name: 'Zendulge Technologies Pty Ltd' },
        { id: '68ef86207cff14ca10c2fa39', name: 'Another Company Ltd' },
      ]);
      
      // Critical: All IDs must be strings
      companies.forEach(company => {
        expect(typeof company.id).toBe('string');
        expect(company.id).toMatch(/^[0-9a-fA-F]{24}$/); // Valid ObjectId string format
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle object without _id', () => {
      const doc = { name: 'Test', value: 123 };
      const result = transformLeanResult(doc);
      expect(result).toEqual({ name: 'Test', value: 123 });
    });

    it('should handle deeply nested structures', () => {
      const doc = {
        _id: new Types.ObjectId('68ef86207cff14ca10c2fa33'),
        level1: {
          _id: new Types.ObjectId('68ef86207cff14ca10c2fa34'),
          level2: {
            _id: new Types.ObjectId('68ef86207cff14ca10c2fa35'),
            name: 'Deep',
          },
        },
      };
      
      const result: any = transformLeanResult(doc);
      
      expect(result.id).toBe('68ef86207cff14ca10c2fa33');
      expect(result.level1.id).toBe('68ef86207cff14ca10c2fa34');
      expect(result.level1.level2.id).toBe('68ef86207cff14ca10c2fa35');
      expect(result.level1.level2.name).toBe('Deep');
    });

    it('should handle mixed data types in arrays', () => {
      const doc = {
        mixed: [
          { _id: new Types.ObjectId('68ef86207cff14ca10c2fa38'), name: 'Object' },
          'string',
          123,
          null,
        ],
      };
      
      const result: any = transformLeanResult(doc);
      
      expect(result.mixed[0]).toEqual({ id: '68ef86207cff14ca10c2fa38', name: 'Object' });
      expect(result.mixed[1]).toBe('string');
      expect(result.mixed[2]).toBe(123);
      expect(result.mixed[3]).toBeNull();
    });
  });

  describe('CRITICAL: Company ID Bug Prevention', () => {
    it('should NEVER return empty object as company ID (THE BUG)', () => {
      // This test specifically prevents the bug where company.id was returning {}
      const companyId = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const leanCompanyResult = {
        _id: companyId,
        name: 'Zendulge Technologies Pty Ltd',
        isActive: true,
        __v: 0,
      };
      
      const result: any = transformLeanResult(leanCompanyResult);
      
      // CRITICAL ASSERTIONS TO PREVENT THE BUG
      expect(result.id).toBeDefined();
      expect(result.id).not.toBe('');
      expect(result.id).not.toBe('{}');
      expect(result.id).not.toEqual({});
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBe(24); // MongoDB ObjectId is 24 characters
      expect(result.id).toMatch(/^[0-9a-fA-F]{24}$/);
      expect(result.id).toBe('68ef86207cff14ca10c2fa38');
      
      // Ensure the bug symptoms never occur
      expect(JSON.stringify(result.id)).not.toBe('{}');
      expect(typeof result.id).toBe('string'); // String primitives have no enumerable keys
    });

    it('should work correctly in user.generateAuthToken scenario', () => {
      // Simulate the exact scenario from user.generateAuthToken
      const company1Id = new Types.ObjectId('68ef86207cff14ca10c2fa38');
      const company2Id = new Types.ObjectId('68ef86207cff14ca10c2fa39');
      
      const userCompaniesLeanResult = [
        { _id: company1Id, name: 'Company 1' },
        { _id: company2Id, name: 'Company 2' },
      ];
      
      const transformedCompanies: any = transformLeanResult(userCompaniesLeanResult);
      
      // This should work without any fallback logic
      const companies = transformedCompanies.map((c: any) => ({ 
        id: c.id, 
        name: c.name,
      }));
      
      // Verify each company ID is valid
      for (const company of companies) {
        expect(company.id).toBeDefined();
        expect(typeof company.id).toBe('string');
        expect(company.id).not.toBe('');
        expect(company.id).not.toBe('{}');
        expect(company.id).not.toEqual({});
        expect(company.id).toMatch(/^[0-9a-fA-F]{24}$/);
      }
      
      expect(companies[0].id).toBe('68ef86207cff14ca10c2fa38');
      expect(companies[1].id).toBe('68ef86207cff14ca10c2fa39');
    });
  });
});
