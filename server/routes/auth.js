import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['resident', 'admin', 'committee', 'staff', 'security']),
  body('societyId').optional().isString(),
  body('flatNumber').optional().isString(),
  body('phone').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let societyId = req.body.societyId;
  if (!societyId) {
    const society = await prisma.society.create({
      data: { name: 'Default Society', address: 'Sample Address' }
    });
    societyId = society.id;
  }

  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      password: hashed,
      name: req.body.name,
      role: req.body.role,
      societyId,
      flatNumber: req.body.flatNumber || null,
      phone: req.body.phone || null
    },
    select: { id: true, email: true, name: true, role: true, flatNumber: true, societyId: true }
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({ user, token });
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, flatNumber: user.flatNumber, societyId: user.societyId },
    token
  });
});

export default router;
