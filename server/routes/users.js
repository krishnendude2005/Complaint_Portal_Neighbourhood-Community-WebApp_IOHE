import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(authenticate);
router.use(requireRole('admin', 'committee'));

// Get staff list for assignment
router.get('/staff', async (req, res) => {
  const staff = await prisma.user.findMany({
    where: {
      societyId: req.user.societyId,
      role: 'staff'
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { assignedTo: true }
      }
    }
  });

  const result = staff.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    activeComplaints: s._count.assignedTo
  }));
  res.json(result);
});

// Get societies (for setup)
router.get('/societies', async (req, res) => {
  const societies = await prisma.society.findMany({
    select: { id: true, name: true, address: true }
  });
  res.json(societies);
});

export default router;
