import { Request, Response } from 'express';
import { db } from '../../app';

export const getPublicStats = async (req: Request, res: Response) => {
    try {
        const studentCountRes = await db.query('SELECT COUNT(*) FROM "Student"');
        const classCountRes = await db.query('SELECT COUNT(*) FROM "Class"');

        res.json({
            students: `${parseInt(studentCountRes.rows[0].count)}+`,
            classes: `${parseInt(classCountRes.rows[0].count)}+`,
        });
    } catch (error) {
        console.error('Public stats error:', error);
        res.status(500).json({ error: 'Failed to fetch public stats' });
    }
};
