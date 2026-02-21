import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../app';
import { RegisterSchema, LoginSchema } from '@school/shared';
import { logAction } from '../../utils/logger';



export const register = async (req: Request, res: Response) => {
    try {
        const validation = RegisterSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { email, password, display_name, role, phone } = validation.data;

        const existingUserRes = await db.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (existingUserRes.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const isApproved = role === 'HEADMASTER';

        const userRes = await db.query(
            'INSERT INTO "User" (email, password, display_name, role, phone, is_approved) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [email, hashedPassword, display_name, role, phone, isApproved]
        );
        const user = userRes.rows[0];

        await logAction('INFO', `New user registered: ${email}`, 'REGISTER', user.id, req.ip);

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validation = LoginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { email, password } = validation.data;

        const userRes = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_approved && user.role !== 'HEADMASTER') {
            return res.status(403).json({ error: 'Account pending approval from headmaster' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, {
            expiresIn: '7day'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        await logAction('INFO', `User logged in: ${email}`, 'LOGIN', user.id, req.ip);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                role: user.role,
                photo_url: user.photo_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const logout = async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user) {
        await logAction('INFO', `User logged out: ${user.email}`, 'LOGOUT', user.id, req.ip);
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};

export const me = async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
        user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            role: user.role,
            photo_url: user.photo_url
        }
    });
};
