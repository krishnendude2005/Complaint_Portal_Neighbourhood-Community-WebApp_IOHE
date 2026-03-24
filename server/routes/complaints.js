import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { getDefaultPriority, STATUSES, PRIORITIES } from '../lib/constants.js';

const router = Router();

router.use(authenticate);

// Create complaint
router.post('/', [
  body('category').isString().notEmpty(),
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('description').trim().isLength({ min: 10 }),
  body('subcategory').optional().isString(),
  body('location').optional().isString(),
  body('images').optional().isArray(),
  body('flatNumber').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { category, subcategory, title, description, location, images, flatNumber } = req.body;
  const priority = getDefaultPriority(category, subcategory);
  const imagesJson = images?.length ? JSON.stringify(images) : null;

  const complaint = await prisma.complaint.create({
    data: {
      societyId: req.user.societyId,
      reporterId: req.user.id,
      flatNumber: flatNumber || req.user.flatNumber || null,
      category,
      subcategory: subcategory || null,
      priority,
      title,
      description,
      location: location || null,
      images: imagesJson,
      status: 'open'
    },
    include: {
      reporter: { select: { name: true, flatNumber: true } }
    }
  });

  await prisma.complaintUpdate.create({
    data: {
      complaintId: complaint.id,
      updatedBy: req.user.id,
      updateType: 'status_change',
      newStatus: 'open',
      content: 'Complaint filed'
    }
  });

  res.status(201).json(complaint);
});

// Get complaints (with filters)
router.get('/', [
  query('status').optional().isIn(STATUSES),
  query('priority').optional().isIn(PRIORITIES),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('assignedTo').optional().isString()
], async (req, res) => {
  const { status, priority, category, limit = 50, assignedTo } = req.query;
  const where = { societyId: req.user.societyId };

  if (req.user.role === 'resident') {
    where.reporterId = req.user.id;
  } else if (req.user.role === 'staff') {
    where.assignedTo = req.user.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (assignedTo && ['admin', 'committee'].includes(req.user.role)) where.assignedTo = assignedTo;

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: [
      { priority: 'asc' },
      { createdAt: 'desc' }
    ],
    take: parseInt(limit) || 50,
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });

  res.json(complaints);
});

// Get single complaint
router.get('/:id', async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: {
      id: req.params.id,
      societyId: req.user.societyId,
      ...(req.user.role === 'resident' && { reporterId: req.user.id }),
      ...(req.user.role === 'staff' && { assignedTo: req.user.id })
    },
    include: {
      reporter: { select: { name: true, flatNumber: true, email: true } },
      assignedStaff: { select: { name: true, id: true } },
      updates: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } }
      }
    }
  });

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  res.json(complaint);
});

// Assign complaint
router.patch('/:id/assign', requireRole('admin', 'committee'), [
  body('assignedTo').isString().notEmpty(),
  body('internalNote').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const updated = await prisma.complaint.update({
    where: { id: req.params.id },
    data: {
      assignedTo: req.body.assignedTo,
      assignedAt: new Date(),
      status: 'assigned',
      internalNote: req.body.internalNote || complaint.internalNote,
      updatedAt: new Date()
    },
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });

  await prisma.complaintUpdate.create({
    data: {
      complaintId: complaint.id,
      updatedBy: req.user.id,
      updateType: 'assignment',
      oldStatus: complaint.status,
      newStatus: 'assigned',
      content: `Assigned to staff`
    }
  });

  res.json(updated);
});

// Update status
router.patch('/:id/status', [
  body('status').isIn(STATUSES),
  body('comment').optional().isString(),
  body('photos').optional().isArray()
], async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const canUpdate = ['admin', 'committee'].includes(req.user.role) ||
    (req.user.role === 'staff' && complaint.assignedTo === req.user.id);
  if (!canUpdate) return res.status(403).json({ error: 'Forbidden' });

  const photosJson = req.body.photos?.length ? JSON.stringify(req.body.photos) : null;
  const updateData = {
    status: req.body.status,
    updatedAt: new Date(),
    ...(req.body.status === 'resolved' && { resolvedAt: new Date() }),
    ...(req.body.status === 'closed' && { closedAt: new Date() })
  };

  const updated = await prisma.complaint.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });

  await prisma.complaintUpdate.create({
    data: {
      complaintId: complaint.id,
      updatedBy: req.user.id,
      updateType: 'status_change',
      oldStatus: complaint.status,
      newStatus: req.body.status,
      content: req.body.comment || null,
      photos: photosJson
    }
  });

  res.json(updated);
});

// Add comment
router.post('/:id/comments', [
  body('comment').trim().notEmpty(),
  body('visibility').optional().isIn(['public', 'internal'])
], async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const canComment = req.user.role === 'resident' && complaint.reporterId === req.user.id ||
    ['admin', 'committee', 'staff'].includes(req.user.role);
  if (!canComment) return res.status(403).json({ error: 'Forbidden' });

  const updateType = req.body.visibility === 'internal' && ['admin', 'committee'].includes(req.user.role) ? 'comment' : 'comment';
  await prisma.complaintUpdate.create({
    data: {
      complaintId: complaint.id,
      updatedBy: req.user.id,
      updateType,
      content: req.body.comment
    }
  });

  const updated = await prisma.complaint.findUnique({
    where: { id: req.params.id },
    include: { updates: { orderBy: { createdAt: 'desc' }, take: 10 } }
  });
  res.json(updated);
});

// Mark resolved (staff)
router.patch('/:id/resolve', requireRole('admin', 'committee', 'staff'), [
  body('resolutionNote').optional().isString(),
  body('completionPhotos').optional().isArray()
], async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (req.user.role === 'staff' && complaint.assignedTo !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const photosJson = req.body.completionPhotos?.length ? JSON.stringify(req.body.completionPhotos) : null;
  const updated = await prisma.complaint.update({
    where: { id: req.params.id },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });

  await prisma.complaintUpdate.create({
    data: {
      complaintId: complaint.id,
      updatedBy: req.user.id,
      updateType: 'photo',
      oldStatus: complaint.status,
      newStatus: 'resolved',
      content: req.body.resolutionNote || 'Marked as resolved',
      photos: photosJson
    }
  });

  res.json(updated);
});

// Rate complaint (resident)
router.post('/:id/rate', [
  body('rating').isInt({ min: 1, max: 5 }),
  body('feedback').optional().isString()
], async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId, reporterId: req.user.id }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (complaint.status !== 'resolved') return res.status(400).json({ error: 'Can only rate resolved complaints' });

  const updated = await prisma.complaint.update({
    where: { id: req.params.id },
    data: {
      rating: req.body.rating,
      feedback: req.body.feedback || null,
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });

  res.json(updated);
});

// Change priority (admin)
router.patch('/:id/priority', requireRole('admin', 'committee'), [
  body('priority').isIn(PRIORITIES)
], async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const updated = await prisma.complaint.update({
    where: { id: req.params.id },
    data: { priority: req.body.priority, updatedAt: new Date() },
    include: {
      reporter: { select: { name: true, flatNumber: true } },
      assignedStaff: { select: { name: true } }
    }
  });
  res.json(updated);
});

// Delete complaint (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const complaint = await prisma.complaint.findFirst({
    where: { id: req.params.id, societyId: req.user.societyId }
  });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  await prisma.complaint.delete({ where: { id: req.params.id } });
  res.json({ message: 'Complaint deleted' });
});

export default router;
