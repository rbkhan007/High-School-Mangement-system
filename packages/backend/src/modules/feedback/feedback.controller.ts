import { Request, Response } from 'express';
import { db } from '../../app';
import { FeedbackSchema } from '@school/shared';

export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const validation = FeedbackSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { name, email, message, rating } = validation.data;
        const feedbackRes = await db.query(
            'INSERT INTO "Feedback" (name, email, message, rating) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, message, rating]
        );

        res.status(201).json({ message: 'Feedback submitted successfully', feedback: feedbackRes.rows[0] });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
};

export const getAllFeedback = async (req: Request, res: Response) => {
    try {
        const feedbackRes = await db.query('SELECT * FROM "Feedback" ORDER BY created_at DESC');
        res.json(feedbackRes.rows);
    } catch (error) {
        console.error('Get all feedback error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
};
