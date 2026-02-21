import { Request, Response } from 'express';
import { db } from '../../app';
import { io } from '../../server';
import { logAction } from '../../utils/logger';
import { MarkAttendanceSchema } from '@school/shared';



export const markAttendance = async (req: Request, res: Response) => {
    try {
        const validation = MarkAttendanceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { date, class_id, records } = validation.data;
        const user = (req as any).user;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const attendanceRecords = [];

            for (const record of records) {
                const attRes = await client.query(
                    `INSERT INTO "Attendance" (date, class_id, student_id, status, marked_by) 
                     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    [date, class_id, record.student_id, record.status, user.id]
                );
                const att = attRes.rows[0];

                // Real-time update to parents
                const parentRes = await client.query(
                    'SELECT parent_id FROM "ParentStudent" WHERE student_id = $1 LIMIT 1',
                    [record.student_id]
                );
                if (parentRes.rows.length > 0) {
                    io.to(`parent-${parentRes.rows[0].parent_id}`).emit('attendance-update', att);
                }
                attendanceRecords.push(att);
            }
            await client.query('COMMIT');

            await logAction('INFO', `Attendance marked for class ${class_id} on ${date}`, 'MARK_ATTENDANCE', user.id, req.ip);
            res.status(201).json(attendanceRecords);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

export const getAttendanceReport = async (req: Request, res: Response) => {
    try {
        const { date, class_id } = req.query;
        let queryText = `
            SELECT a.*, u.display_name as student_name, s.roll_number 
            FROM "Attendance" a 
            JOIN "Student" s ON a.student_id = s.user_id 
            JOIN "User" u ON s.user_id = u.id`;
        const queryParams = [];
        const whereClauses = [];

        if (date) {
            queryParams.push(date);
            whereClauses.push(`a.date = $${queryParams.length}`);
        }
        if (class_id) {
            queryParams.push(class_id);
            whereClauses.push(`a.class_id = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        const reportRes = await db.query(queryText, queryParams);
        res.json(reportRes.rows);
    } catch (error) {
        console.error('Attendance report error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance report' });
    }
};
