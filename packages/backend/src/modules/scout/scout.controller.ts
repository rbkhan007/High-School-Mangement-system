import { Request, Response } from 'express';
import { db } from '../../app';
import { logAction } from '../../utils/logger';
import { ScoutRegistrationSchema, ScoutUpdateSchema } from '@school/shared';



export const registerScout = async (req: Request, res: Response) => {
    try {
        const validation = ScoutRegistrationSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { student_id, rank, badges, join_date } = validation.data;

        // Check if student exists
        const studentRes = await db.query('SELECT * FROM "Student" WHERE user_id = $1', [student_id]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check if already a scout member
        const existingMemberRes = await db.query('SELECT * FROM "ScoutMember" WHERE student_id = $1', [student_id]);
        if (existingMemberRes.rows.length > 0) {
            return res.status(400).json({ error: 'Student is already a scout member' });
        }

        const scoutRes = await db.query(
            `INSERT INTO "ScoutMember" (student_id, rank, badges, join_date) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [student_id, rank || 'Member', badges || [], join_date || new Date()]
        );
        const scout = scoutRes.rows[0];

        // Fetch user data for logging
        const userRes = await db.query('SELECT display_name FROM "User" WHERE id = $1', [student_id]);
        const userName = userRes.rows[0]?.display_name || 'Unknown';

        await logAction((req as any).user.id, 'INFO', `New scout registered: ${userName}`, {
            student_id,
            rank: scout.rank
        });

        res.status(201).json({ message: 'Scout registered successfully', scout });
    } catch (error) {
        console.error('Scout registration error:', error);
        res.status(500).json({ error: 'Failed to register scout' });
    }
};

export const getScoutProfile = async (req: Request, res: Response) => {
    try {
        const { student_id } = req.params;
        const scoutRes = await db.query(
            `SELECT sm.*, u.display_name, u.email 
             FROM "ScoutMember" sm 
             JOIN "Student" s ON sm.student_id = s.user_id 
             JOIN "User" u ON s.user_id = u.id 
             WHERE sm.student_id = $1`,
            [student_id]
        );

        if (scoutRes.rows.length === 0) {
            return res.status(404).json({ error: 'Scout member not found' });
        }

        res.json(scoutRes.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scout profile' });
    }
};

export const getAllScouts = async (req: Request, res: Response) => {
    try {
        const scoutsRes = await db.query(
            `SELECT sm.*, u.display_name, u.email 
             FROM "ScoutMember" sm 
             JOIN "Student" s ON sm.student_id = s.user_id 
             JOIN "User" u ON s.user_id = u.id`
        );
        res.json(scoutsRes.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scouts list' });
    }
};

export const updateScoutProfile = async (req: Request, res: Response) => {
    try {
        const { student_id } = req.params;
        const validation = ScoutUpdateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const keys = Object.keys(validation.data);
        if (keys.length === 0) return res.status(400).json({ error: 'No data to update' });

        const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        const queryText = `UPDATE "ScoutMember" SET ${setClause} WHERE student_id = $${keys.length + 1} RETURNING *`;
        const queryParams = [...Object.values(validation.data), student_id];

        const updatedRes = await db.query(queryText, queryParams);
        res.json({ message: 'Scout profile updated successfully', scout: updatedRes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update scout profile' });
    }
};

export const deleteScoutMember = async (req: Request, res: Response) => {
    try {
        const { student_id } = req.params;

        // Fetch user data for logging before deletion
        const userRes = await db.query(
            `SELECT u.display_name 
             FROM "ScoutMember" sm 
             JOIN "Student" s ON sm.student_id = s.user_id 
             JOIN "User" u ON s.user_id = u.id 
             WHERE sm.student_id = $1`,
            [student_id]
        );
        const userName = userRes.rows[0]?.display_name || 'Unknown';

        await db.query('DELETE FROM "ScoutMember" WHERE student_id = $1', [student_id]);

        await logAction((req as any).user.id, 'INFO', `Scout member removed: ${userName}`, {
            student_id
        });

        res.json({ message: 'Scout member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete scout member' });
    }
};
