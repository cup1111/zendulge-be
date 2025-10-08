import express from 'express';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

router.post('/register', (req: any, res: any) => {
  res.sendStatus(201);
});

router.post('/business-owner-register', (req: any, res: any) => {
  res.sendStatus(201);
});

router.post('/login', (req: any, res: any) => {
  res.sendStatus(200);
});

router.post('/logout', (req: any, res: any) => {
  res.sendStatus(200);
});

export default router;
