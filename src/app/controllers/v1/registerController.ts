import { Request, Response } from 'express';
import registerServices, { IBusinessOwnerRegistration } from '../../services/registerServices';
import userService from '../../services/userService';

export const register = async (req: Request, res: Response) => {
  try {
    const registrationData: IBusinessOwnerRegistration = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'name', 'companyName'];
    const missingFields = requiredFields.filter(field => !registrationData[field as keyof IBusinessOwnerRegistration]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Register business owner
    const result = await registerServices.register(registrationData);

    res.status(201).json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const { activationCode } = req.params;

    if (!activationCode) {
      return res.status(400).json({
        success: false,
        message: 'Activation code is required',
      });
    }

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