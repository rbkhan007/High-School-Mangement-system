import { Request, Response } from 'express';
import { db } from '../../app';

export const getRoutineByClass = async (req: Request, res: Response) => {
    try {
        const { class_id } = req.query;
        if (!class_id) {
            return res.status(400).json({ error: 'class_id is required' });
        }

        const routineRes = await db.query(
            `SELECT r.*, u.display_name as teacher_name 
             FROM "Routine" r 
             JOIN "Teacher" t ON r.teacher_id = t.user_id 
             JOIN "User" u ON t.user_id = u.id 
             WHERE r.class_id = $1 
             ORDER BY r.day, r.period_number`,
            [class_id]
        );

        // Transform to meet frontend expectations if necessary
        // The frontend expects: teacher: { user: { display_name: string } }
        const transformedData = routineRes.rows.map(row => ({
            ...row,
            teacher: {
                user: {
                    display_name: row.teacher_name
                }
            }
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Get routine error:', error);
        res.status(500).json({ error: 'Failed to fetch routine' });
    }
};

export const createRoutineItem = async (req: Request, res: Response) => {
    try {
        const { class_id, day, period_number, subject, teacher_id, start_time, end_time } = req.body;

        const routineRes = await db.query(
            `INSERT INTO "Routine" (class_id, day, period_number, subject, teacher_id, start_time, end_time) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [class_id, day, period_number, subject, teacher_id, start_time, end_time]
        );

        res.status(201).json(routineRes.rows[0]);
    } catch (error) {
        console.error('Create routine error:', error);
        res.status(500).json({ error: 'Failed to create routine item' });
    }
};
