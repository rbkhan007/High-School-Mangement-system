import { Request, Response } from 'express';
import { db } from '../../app';
import { io } from '../../server';
import { logAction } from '../../utils/logger';
import { GrievanceSchema } from '@school/shared';

export const submitGrievance = async (req: Request, res: Response) => {
    try {
        const { title, description, category, anonymous } = req.body;
        const user = (req as any).user;

        const grievanceRes = await db.query(
            `INSERT INTO "Grievance" (title, description, category, anonymous, submitted_by, status) 
             VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
            [title, description, category, anonymous, anonymous ? null : user.id]
        );
        const grievance = grievanceRes.rows[0];

        io.to('committee').emit('new-grievance', grievance);

        await logAction(user.id, 'INFO', `New grievance: ${title}`, {
            grievance_id: grievance.id,
            category
        });

        res.status(201).json(grievance);
    } catch (error) {
        console.error('Submit grievance error:', error);
        res.status(500).json({ error: 'Failed to submit grievance' });
    }
};

export const updateGrievanceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;

        const grievanceRes = await db.query(
            'UPDATE "Grievance" SET status = $1, resolution = $2 WHERE id = $3 RETURNING *',
            [status, resolution, id]
        );
        const grievance = grievanceRes.rows[0];

        if (grievance && grievance.submitted_by) {
            io.to(`user-${grievance.submitted_by}`).emit('grievance-update', grievance);
        }

        await logAction((req as any).user.id, 'INFO', `Grievance status changed to ${status}`, {
            grievance_id: id,
            status
        });

        res.json(grievance);
    } catch (error) {
        console.error('Update grievance error:', error);
        res.status(500).json({ error: 'Failed to update grievance' });
    }
};
