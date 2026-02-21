import { Request, Response } from 'express';
import { db } from '../../app';
import { ClassSchema } from '@school/shared';

export const createClass = async (req: Request, res: Response) => {
    try {
        const validation = ClassSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { name, section, room_number, class_teacher_id } = validation.data;

        const classRes = await db.query(
            'INSERT INTO "Class" (name, section, room_number, class_teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, section, room_number, class_teacher_id]
        );

        res.status(201).json(classRes.rows[0]);
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Failed to create class' });
    }
};

export const getClasses = async (req: Request, res: Response) => {
    try {
        const classesRes = await db.query(
            `SELECT c.*, u.display_name as teacher_name 
             FROM "Class" c 
             LEFT JOIN "Teacher" t ON c.class_teacher_id = t.user_id 
             LEFT JOIN "User" u ON t.user_id = u.id`
        );

        // Fetch student counts for each class
        const classesWithCounts = await Promise.all(classesRes.rows.map(async (cls) => {
            const countRes = await db.query('SELECT COUNT(*) FROM "Student" WHERE class = $1 AND section = $2', [cls.name, cls.section]);
            return { ...cls, student_count: parseInt(countRes.rows[0].count) };
        }));

        res.json(classesWithCounts);
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Failed to fetch classes' });
    }
};
