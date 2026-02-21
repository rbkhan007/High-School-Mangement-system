import { Request, Response } from 'express';
import { db } from '../../app';
import { TeacherSchema, LeaveSchema } from '@school/shared';



export const getTeachers = async (req: Request, res: Response) => {
    try {
        const teachersRes = await db.query(
            'SELECT t.*, u.email, u.display_name, u.phone, u.photo_url FROM "Teacher" t JOIN "User" u ON t.user_id = u.id'
        );
        res.json(teachersRes.rows);
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};

export const addTeacher = async (req: Request, res: Response) => {
    try {
        const validation = TeacherSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { email, display_name, phone, employee_id, subjects, mpo_id } = validation.data;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const userRes = await client.query(
                `INSERT INTO "User" (email, display_name, phone, role, password, is_approved) 
                 VALUES ($1, $2, $3, 'TEACHER', 'teacher123', true) RETURNING *`,
                [email, display_name, phone]
            );
            const user = userRes.rows[0];

            const teacherRes = await client.query(
                'INSERT INTO "Teacher" (user_id, employee_id, subjects, mpo_id) VALUES ($1, $2, $3, $4) RETURNING *',
                [user.id, employee_id, subjects, mpo_id]
            );
            await client.query('COMMIT');
            res.status(201).json({ ...user, teacher: teacherRes.rows[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Add teacher error:', error);
        res.status(500).json({ error: 'Failed to add teacher' });
    }
};

export const applyLeave = async (req: Request, res: Response) => {
    try {
        const validation = LeaveSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { start_date, end_date, reason } = validation.data;
        const user = (req as any).user;

        const leaveRes = await db.query(
            'INSERT INTO "LeaveRequest" (teacher_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.id, start_date, end_date, reason]
        );
        res.status(201).json(leaveRes.rows[0]);
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ error: 'Failed to apply for leave' });
    }
};
