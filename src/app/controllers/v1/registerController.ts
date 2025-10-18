import { Request, Response } from 'express';
import userService from '../../services/userService';
import registerServices, { IBusinessRegistration, ICustomerRegistration } from '../../services/registerServices';

export const registerBusiness = async (req: Request, res: Response) => {
  const registrationData: IBusinessRegistration = req.body;

  const result = await registerServices.businessRegister(registrationData);

  res.status(201).json(result);
};

export const registerCustomer = async (req: Request, res: Response) => {
  const registrationData: ICustomerRegistration = req.body;

  const result = await registerServices.customerRegister(registrationData);

  res.status(201).json(result);
};

export const activateAccount = async (req: Request, res: Response) => {
  const { token } = req.params;
  const activationCode = token;

  const user = await userService.activateUser(activationCode);

  res.status(200).json({
    success: true,
    message: 'Account activated successfully',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      active: user.active,
    },
  });
};

