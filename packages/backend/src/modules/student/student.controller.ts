import { Request, Response } from 'express';
import { db } from '../../app';
import { logAction } from '../../utils/logger';
import { EnrollmentSchema } from '@school/shared';



export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const validation = EnrollmentSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }
        const { email, display_name, phone, class: className, section, roll_number } = validation.data;

        const existingUserRes = await db.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (existingUserRes.rows.length > 0) return res.status(400).json({ error: 'User with this email already exists' });

        const year = new Date().getFullYear();
        const studentCountRes = await db.query('SELECT COUNT(*) FROM "Student" WHERE class = $1', [className]);
        const studentCount = parseInt(studentCountRes.rows[0].count);
        const studentId = `BHS-${year}-${className.padStart(2, '0')}-${(studentCount + 1).toString().padStart(3, '0')}`;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            const userRes = await client.query(
                `INSERT INTO "User" (email, display_name, phone, role, password, is_approved) 
                 VALUES ($1, $2, $3, 'STUDENT', 'student123', true) RETURNING id`,
                [email, display_name, phone]
            );
            const userId = userRes.rows[0].id;

            await client.query(
                `INSERT INTO "Student" (user_id, student_id, class, section, roll_number) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, studentId, className, section, roll_number]
            );
            await client.query('COMMIT');

            await logAction('INFO', `New student enrolled: ${studentId}`, 'ENROLL_STUDENT', (req as any).user?.id, req.ip);
            res.status(201).json({ message: 'Student enrolled successfully', studentId });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: 'Enrollment failed' });
    }
};

export const getStudents = async (req: Request, res: Response) => {
    const { class: className, section } = req.query;
    try {
        let queryText = 'SELECT s.*, u.email, u.display_name, u.phone, u.photo_url FROM "Student" s JOIN "User" u ON s.user_id = u.id';
        const queryParams = [];
        const whereClauses = [];

        if (className) {
            queryParams.push(className);
            whereClauses.push(`s.class = $${queryParams.length}`);
        }
        if (section) {
            queryParams.push(section);
            whereClauses.push(`s.section = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        const studentsRes = await db.query(queryText, queryParams);
        res.json(studentsRes.rows);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

export const getStudentProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const studentRes = await db.query(
            `SELECT s.*, u.email, u.display_name, u.phone, u.photo_url 
             FROM "Student" s 
             JOIN "User" u ON s.user_id = u.id 
             WHERE s.user_id = $1`,
            [id]
        );
        const student = studentRes.rows[0];
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Fetch related data in parallel for efficiency
        const [attendance, marks, submissions, scoutProfile, borrows] = await Promise.all([
            db.query('SELECT * FROM "Attendance" WHERE student_id = $1', [id]),
            db.query('SELECT m.*, e.name as exam_name FROM "Mark" m JOIN "Exam" e ON m.exam_id = e.id WHERE m.student_id = $1', [id]),
            db.query('SELECT * FROM "Submission" WHERE student_id = $1', [id]),
            db.query('SELECT * FROM "ScoutMember" WHERE student_id = $1', [id]),
            db.query('SELECT br.*, b.title as book_title FROM "BorrowRecord" br JOIN "Book" b ON br.book_id = b.id WHERE br.user_id = $1', [id])
        ]);

        res.json({
            ...student,
            attendance: attendance.rows,
            marks: marks.rows,
            submissions: submissions.rows,
            scout_profile: scoutProfile.rows[0],
            borrows: borrows.rows
        });
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({ error: 'Failed to fetch student profile' });
    }
};
