import { Request, Response } from 'express';
import { db } from '../../app';
import { AssignmentSchema } from '@school/shared';



export const createAssignment = async (req: Request, res: Response) => {
    try {
        const validation = AssignmentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { title, description, class: className, subject, due_date } = validation.data;
        const user = (req as any).user;

        const assignmentRes = await db.query(
            `INSERT INTO "Assignment" (title, description, class, subject, due_date, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description, className, subject, due_date, user.id]
        );

        res.status(201).json(assignmentRes.rows[0]);
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
};

export const getAssignmentsByClass = async (req: Request, res: Response) => {
    try {
        const { class_name } = req.params;
        const assignmentsRes = await db.query(
            `SELECT a.*, u.display_name as creator_name 
             FROM "Assignment" a 
             JOIN "User" u ON a.created_by = u.id 
             WHERE a.class = $1`,
            [class_name]
        );
        res.json(assignmentsRes.rows);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM "Assignment" WHERE id = $1', [id]);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
};
