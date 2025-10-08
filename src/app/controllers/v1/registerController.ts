import { Request, Response } from 'express';
import userService from '../../services/userService';
import registerServices, { IBusinessOwnerRegistration, IClientRegistration } from '../../services/registerServices';

export const registerBusinessOwner = async (req: Request, res: Response) => {
  const registrationData: IBusinessOwnerRegistration = req.body;

  const result = await registerServices.businessOwnerRegister(registrationData);

  res.status(201).json(result);

 
};

export const registerClient = async (req: Request, res: Response) => {
  const registrationData: IClientRegistration = req.body;

  const result = await registerServices.clientRegister(registrationData);

  res.status(201).json(result);

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
    const errorMessage = error instanceof Error ? error.message : 'Activation failed';
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

