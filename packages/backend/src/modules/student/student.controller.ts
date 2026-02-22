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

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // 1. Get Student ID based on User ID
        const studentRes = await db.query('SELECT user_id, class FROM "Student" WHERE user_id = $1', [userId]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student profile not found' });

        const studentClass = studentRes.rows[0].class;

        // 2. Mock or Aggregate actual stats for the student dashboard
        // Attendance Rate
        const totalClassesRes = await db.query('SELECT COUNT(*) FROM "Attendance" WHERE student_id = $1', [userId]);
        const presentClassesRes = await db.query('SELECT COUNT(*) FROM "Attendance" WHERE student_id = $1 AND status = $2', [userId, 'PRESENT']);

        const total = parseInt(totalClassesRes.rows[0].count);
        const present = parseInt(presentClassesRes.rows[0].count);
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) + '%' : '100%';

        // Assignments Due
        const assignmentsRes = await db.query('SELECT COUNT(*) FROM "Assignment" WHERE class_id IN (SELECT id FROM "Class" WHERE name = $1) AND due_date > CURRENT_TIMESTAMP', [studentClass]);

        // Scout Badges
        const scoutRes = await db.query('SELECT badges FROM "ScoutMember" WHERE student_id = $1', [userId]);
        const badgesCount = scoutRes.rows[0]?.badges ? Object.keys(scoutRes.rows[0].badges).length : 0;

        res.json({
            attendanceRate,
            assignmentsDue: parseInt(assignmentsRes.rows[0].count),
            averageGrade: 'A-', // Assuming complex calculation for later
            scoutBadges: badgesCount,
            upcomingDeadlines: [
                { task: 'Science Project Draft', due: 'Tomorrow, 5 PM', subject: 'Science' }
            ],
            recentGrades: [
                { exam: 'Term 1 Math', score: '92/100', grade: 'A+' }
            ]
        });
    } catch (error) {
        console.error('Get student dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
