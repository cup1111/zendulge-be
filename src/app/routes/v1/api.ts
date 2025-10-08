import express from 'express';

const router = express.Router();

router.get('/', (req: any, res: any) => {
  res.sendStatus(201);
});

export default router;
