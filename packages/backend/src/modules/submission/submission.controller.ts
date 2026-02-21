import { Request, Response } from 'express';
import { db } from '../../app';
import { SubmissionSchema, GradeSchema } from '@school/shared';



export const submitAssignment = async (req: Request, res: Response) => {
    try {
        const validation = SubmissionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { assignment_id, content, file_url } = validation.data;
        const student_id = (req as any).user.id;

        const submissionRes = await db.query(
            `INSERT INTO "Submission" (assignment_id, student_id, content, file_url) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [assignment_id, student_id, content, file_url]
        );

        res.status(201).json(submissionRes.rows[0]);
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
};

export const getSubmissionsByAssignment = async (req: Request, res: Response) => {
    try {
        const { assignment_id } = req.params;
        const submissionsRes = await db.query(
            `SELECT s.*, u.display_name as student_name 
             FROM "Submission" s 
             JOIN "User" u ON s.student_id = u.id 
             WHERE s.assignment_id = $1`,
            [assignment_id]
        );
        res.json(submissionsRes.rows);
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

export const gradeSubmission = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = GradeSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { grade, remarks } = validation.data;

        const submissionRes = await db.query(
            'UPDATE "Submission" SET grade = $1, remarks = $2 WHERE id = $3 RETURNING *',
            [grade, remarks, id]
        );

        res.json({ message: 'Submission graded successfully', submission: submissionRes.rows[0] });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ error: 'Failed to grade submission' });
    }
};
