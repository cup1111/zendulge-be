import Company from '../model/company';

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

export default { 
  store,
  findByName,
};