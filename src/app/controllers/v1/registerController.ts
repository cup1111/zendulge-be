import { Request, Response } from 'express';
import userService from '../../services/userService';
import registerServices, { IBusinessOwnerRegistration } from '../../services/registerServices';

export const registerBusinessOwner = async (req: Request, res: Response) => {
  const registrationData: IBusinessOwnerRegistration = req.body;

  // Register business owner
  const result = await registerServices.businessOwnerRegister(registrationData);

  res.status(201).json(result);
};

export const registerClient = async (req: Request, res: Response) => {
  const { email, password, name, jobTitle } = req.body;

  const userData = {
    email,
    password,
    name,
    jobTitle,
    active: false,
  };

  const user = await userService.store(userData);

  // Generate activation code
  const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  await userService.updateActivationCode(user._id.toString(), activationCode);

  // TODO: Send activation email
  // await emailService.sendVerificationEmail(user.email, activationCode);

  res.status(201).json({
    success: true,
    message: 'Client registered successfully. Please check your email to verify your account.',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
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

