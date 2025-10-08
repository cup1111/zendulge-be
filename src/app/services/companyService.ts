import Company from '../model/company';

const store = async (companyData: any) => { 
  const company = new Company(companyData);
  return company.save();
};  

export default { store };