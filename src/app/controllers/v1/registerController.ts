import { Request, Response } from 'express';
import userService from '../../services/userService';
import registerServices, { IBusinessRegistration, ICustomerRegistration } from '../../services/registerServices';

export const registerBusiness = async (req: Request, res: Response) => {
  try {
    const registrationData: IBusinessRegistration = req.body;

    const result = await registerServices.businessRegister(registrationData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
};

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const registrationData: ICustomerRegistration = req.body;

    const result = await registerServices.customerRegister(registrationData);

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed',
    });
  }
};

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const { activationCode } = req.params;

    const user = await userService.activateUser(activationCode);

    res.status(200).json({
      success: true,
      message: 'Account activated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        active: user.active,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Account activation failed',
    });
  }
};

