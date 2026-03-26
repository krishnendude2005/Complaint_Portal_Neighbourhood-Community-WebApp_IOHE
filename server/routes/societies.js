import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth.js';
import { sendInvitationEmail } from '../utils/email.js';

const router = express.Router();
const prisma = new PrismaClient();


// Generate a random society code
function generateSocietyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/societies/register
// Register a new society with its admin
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Society name is required'),
  body('address').optional().trim(),
  body('adminEmail').isEmail().withMessage('Valid email is required'),
  body('adminName').trim().notEmpty().withMessage('Admin name is required'),
  body('adminPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, adminEmail, adminName, adminPassword } = req.body;

    // Check if society name already exists
    const existingSociety = await prisma.society.findFirst({
      where: { name }

      
    });
    if (existingSociety) {
      return res.status(400).json({ error: 'Society name already exists' });
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create society and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create society
      const society = await tx.society.create({
        data: {
          name,
          address: address || null,
          settings: {
            createdAt: new Date().toISOString()
          }
        }
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'admin',
          societyId: society.id
        }
      });

      return { society, admin };
    });

    res.status(201).json({
      message: 'Society registered successfully',
      society: {
        id: result.society.id,
        name: result.society.name,
        address: result.society.address
      },
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        role: result.admin.role
      }
    });
  } catch (error) {
    console.error('Error registering society:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/societies/check-code?code=XXX
// Check if a society code exists (or get basic info)
router.get('/check-code', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Society code is required' });
    }

    // In this implementation, we don't have a separate "code" field yet.
    // We'll use society name or we can add a code field later.
    // For now, we'll return message to implement code field
    res.json({
      exists: false,
      message: 'Society code feature not yet implemented. Use direct registration or invite.'
    });
  } catch (error) {
    console.error('Error checking society code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/societies/:id/invitations
// Create an invitation for a user to join the society (admin only)
router.post('/:id/invitations', authenticate, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['resident', 'staff', 'committee', 'security']).withMessage('Invalid role'),
  body('flatNumber').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const societyId = req.params.id;
    const { email, role, flatNumber } = req.body;

    // Get society and verify it exists
    const society = await prisma.society.findUnique({
      where: { id: societyId }
    });
    if (!society) {
      return res.status(404).json({ error: 'Society not found' });
    }

    // Verify that the authenticated user is an admin of this society
    if (req.user.societyId !== societyId || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only society admin can send invitations' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered. They can join the society if needed.' });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Get inviter from auth middleware
    const inviterId = req.user.id;

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        token,
        email,
        role,
        flatNumber: flatNumber || null,
        societyId,
        invitedBy: inviterId,
        expiresAt
      }
    });

    // Send invitation email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${token}`;

    // Get inviter's name for email
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { name: true }
    });

    const inviterName = inviter?.name || 'An administrator';

    try {
      await sendInvitationEmail(
        email,
        invitationLink,
        society.name,
        inviterName
      );
      console.log(`Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue - invitation is still created, just email failed
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invitations/accept/:token
// Accept an invitation and get registration data
router.get('/invitations/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        society: true,
        inviter: true
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.accepted) {
      return res.status(400).json({ error: 'Invitation already accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    res.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        flatNumber: invitation.flatNumber,
        society: {
          id: invitation.society.id,
          name: invitation.society.name,
          address: invitation.society.address
        },
        inviter: {
          name: invitation.inviter.name,
          email: invitation.inviter.email
        },
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invitations/accept/:token/register
// Register user with invitation token
router.post('/invitations/accept/:token/register', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password, name, phone } = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        society: true
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.accepted) {
      return res.status(400).json({ error: 'Invitation already accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation expired' });
    }

    // Check if email matches invitation email (optional, allow different email?)
    if (req.body.email && req.body.email !== invitation.email) {
      return res.status(400).json({ error: 'Email does not match invitation' });
    }

    // Create user account
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        name: name || invitation.inviter.name, // default to inviter's name if not provided
        role: invitation.role,
        flatNumber: invitation.flatNumber,
        phone: phone || null,
        societyId: invitation.societyId
      }
    });

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        accepted: true,
        acceptedAt: new Date(),
        acceptedByUserId: user.id
      }
    });

    // Generate JWT token (you'll need jsonwebtoken)
    const jwt = require('jsonwebtoken');
    const tokenJwt = jwt.sign(
      { userId: user.id, societyId: user.societyId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        flatNumber: user.flatNumber,
        societyId: user.societyId
      },
      token: tokenJwt
    });
  } catch (error) {
    console.error('Error registering with invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
