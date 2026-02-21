import { Request, Response } from 'express';
import { db } from '../../app';

export const createExam = async (req: Request, res: Response) => {
    try {
        const { name, class_id, type, max_marks, start_date, end_date } = req.body;
        const user = (req as any).user;

        const examRes = await db.query(
            `INSERT INTO "Exam" (name, class_id, type, max_marks, start_date, end_date, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, class_id, type, parseInt(max_marks), new Date(start_date), new Date(end_date), user.id]
        );
        res.status(201).json(examRes.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create exam' });
    }
};

export const enterMarks = async (req: Request, res: Response) => {
    try {
        const { exam_id } = req.params;
        const { marks } = req.body;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const results = [];

            for (const m of marks) {
                let grade = 'F';
                const percentage = (m.marks_obtained / 100) * 100;
                if (percentage >= 80) grade = 'A+';
                else if (percentage >= 70) grade = 'A';
                else if (percentage >= 60) grade = 'A-';
                else if (percentage >= 50) grade = 'B';
                else if (percentage >= 40) grade = 'C';
                else if (percentage >= 33) grade = 'D';

                const markRes = await client.query(
                    `INSERT INTO "Mark" (exam_id, student_id, subject, marks_obtained, grade, remarks) 
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [exam_id, m.student_id, m.subject, parseFloat(m.marks_obtained), grade, m.remarks]
                );
                results.push(markRes.rows[0]);
            }
            await client.query('COMMIT');
            res.status(201).json(results);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to enter marks' });
    }
};

export const getResults = async (req: Request, res: Response) => {
    try {
        const { exam_id, student_id } = req.query;
        let queryText = `
            SELECT m.*, e.name as exam_name, u.display_name as student_name 
            FROM "Mark" m 
            JOIN "Exam" e ON m.exam_id = e.id 
            JOIN "Student" s ON m.student_id = s.user_id 
            JOIN "User" u ON s.user_id = u.id`;
        const queryParams = [];
        const whereClauses = [];

        if (exam_id) {
            queryParams.push(exam_id);
            whereClauses.push(`m.exam_id = $${queryParams.length}`);
        }
        if (student_id) {
            queryParams.push(student_id);
            whereClauses.push(`m.student_id = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        const resultsRes = await db.query(queryText, queryParams);
        res.json(resultsRes.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};
