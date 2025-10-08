import { Request, Response } from 'express';
import   registerServices from '../../services/registerServices';

export const register = async (req: Request, res: Response) => {
  await registerServices.register();
  res.status(201).send({ message: 'User registered successfully' });
};