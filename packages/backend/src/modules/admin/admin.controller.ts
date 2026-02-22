import { Request, Response } from 'express';
import { db } from '../../app';

export const getEntityData = async (req: Request, res: Response) => {
    const { entity } = req.params;
    try {
        let data;
        switch (entity) {
            case 'students':
                const studentsRes = await db.query(
                    `SELECT s.*, u.email, u.display_name, u.phone, u.photo_url, u.role, u.is_approved, u.created_at 
                     FROM "Student" s JOIN "User" u ON s.user_id = u.id`
                );
                data = studentsRes.rows;
                break;
            case 'teachers':
                const teachersRes = await db.query(
                    `SELECT t.*, u.email, u.display_name, u.phone, u.photo_url, u.role, u.is_approved, u.created_at 
                     FROM "Teacher" t JOIN "User" u ON t.user_id = u.id`
                );
                data = teachersRes.rows;
                break;
            case 'attendance':
                const attendanceRes = await db.query(
                    `SELECT a.*, u.display_name as student_name, c.name as class_name 
                     FROM "Attendance" a 
                     JOIN "User" u ON a.student_id = u.id 
                     JOIN "Class" c ON a.class_id = c.id`
                );
                data = attendanceRes.rows;
                break;
            case 'exams':
                const examsRes = await db.query(
                    `SELECT e.*, c.name as class_name 
                     FROM "Exam" e 
                     JOIN "Class" c ON e.class_id = c.id`
                );
                data = examsRes.rows;
                break;
            case 'notices':
                const noticesRes = await db.query('SELECT * FROM "Notice"');
                data = noticesRes.rows;
                break;
            case 'grievances':
                const grievancesRes = await db.query(
                    `SELECT g.*, u1.display_name as submitter_name, u2.display_name as assignee_name 
                     FROM "Grievance" g 
                     LEFT JOIN "User" u1 ON g.submitted_by = u1.id 
                     LEFT JOIN "User" u2 ON g.assigned_to = u2.id`
                );
                data = grievancesRes.rows;
                break;
            case 'feedback':
                const feedbackRes = await db.query('SELECT * FROM "Feedback"');
                data = feedbackRes.rows;
                break;
            case 'classes':
                const classesRes = await db.query(
                    `SELECT c.*, u.display_name as teacher_name 
                     FROM "Class" c 
                     LEFT JOIN "User" u ON c.class_teacher_id = u.id`
                );
                data = classesRes.rows;
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch ${entity}` });
    }
};

export const updateEntityRecord = async (req: Request, res: Response) => {
    const { entity, id } = req.params;
    const updateData = req.body;

    try {
        const tableMap: { [key: string]: string } = {
            students: 'Student',
            teachers: 'Teacher',
            attendance: 'Attendance',
            exams: 'Exam',
            marks: 'Mark',
            notices: 'Notice',
            grievances: 'Grievance',
            classes: 'Class'
        };

        const tableName = tableMap[entity as string];
        if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

        const idColumn = (entity === 'students' || entity === 'teachers') ? 'user_id' : 'id';

        const keys = Object.keys(updateData);
        if (keys.length === 0) return res.status(400).json({ error: 'No data to update' });

        const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        const queryText = `UPDATE "${tableName}" SET ${setClause} WHERE "${idColumn}" = $${keys.length + 1} RETURNING *`;
        const queryParams = [...Object.values(updateData), id];

        const updatedRes = await db.query(queryText, queryParams);
        res.json(updatedRes.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Failed to update ${entity}` });
    }
};

export const batchUpdateEntity = async (req: Request, res: Response) => {
    const { entity } = req.params;
    const { updates } = req.body; // Array of { id, data }

    try {
        const tableMap: { [key: string]: string } = {
            students: 'Student',
            teachers: 'Teacher',
            attendance: 'Attendance',
            exams: 'Exam',
            marks: 'Mark',
            notices: 'Notice',
            grievances: 'Grievance',
            classes: 'Class'
        };

        const tableName = tableMap[entity as string];
        if (!tableName) return res.status(400).json({ error: 'Invalid entity' });

        const idColumn = (entity === 'students' || entity === 'teachers') ? 'user_id' : 'id';

        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            for (const update of updates) {
                const keys = Object.keys(update.data);
                if (keys.length === 0) continue;

                const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
                const queryText = `UPDATE "${tableName}" SET ${setClause} WHERE "${idColumn}" = $${keys.length + 1}`;
                const queryParams = [...Object.values(update.data), update.id];

                await client.query(queryText, queryParams);
            }
            await client.query('COMMIT');
            res.json({ success: true, count: updates.length });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Batch update failed for ${entity}` });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const studentCountRes = await db.query('SELECT COUNT(*) FROM "Student"');
        const teacherCountRes = await db.query('SELECT COUNT(*) FROM "Teacher"');
        const pendingGrievancesRes = await db.query('SELECT COUNT(*) FROM "Grievance" WHERE status = \'PENDING\'');

        const today = new Date().toISOString().split('T')[0];
        const attendanceRes = await db.query(
            'SELECT status, COUNT(*) FROM "Attendance" WHERE date = $1 GROUP BY status',
            [today]
        );

        const attendanceStats = attendanceRes.rows.reduce((acc: any, curr: any) => {
            acc[curr.status.toLowerCase()] = parseInt(curr.count);
            return acc;
        }, { present: 0, absent: 0, late: 0 });

        const totalMarked = attendanceStats.present + attendanceStats.absent + attendanceStats.late;
        const attendanceRate = totalMarked > 0
            ? ((attendanceStats.present / totalMarked) * 100).toFixed(1)
            : '0.0';

        res.json({
            totalStudents: parseInt(studentCountRes.rows[0].count),
            totalTeachers: parseInt(teacherCountRes.rows[0].count),
            pendingGrievances: parseInt(pendingGrievancesRes.rows[0].count),
            attendanceRate: `${attendanceRate}%`,
            uptime: '99.9%'
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

export const getCommitteeStats = async (req: Request, res: Response) => {
    try {
        const attendanceRes = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
            FROM "Attendance" 
            WHERE date >= date_trunc('month', CURRENT_DATE)
        `);

        const total = parseInt(attendanceRes.rows[0].total) || 0;
        const present = parseInt(attendanceRes.rows[0].present) || 0;
        const overallAttendance = total > 0 ? Math.round((present / total) * 100) + '%' : '100%';

        const activeGrievancesRes = await db.query(`SELECT COUNT(*) FROM "Grievance" WHERE status NOT IN ('RESOLVED', 'REJECTED')`);

        res.json({
            overallAttendance,
            activeGrievances: parseInt(activeGrievancesRes.rows[0].count),
            infrastructure: 'Good', // Mock
            policies: 12, // Mock
            recentGrievances: [
                { title: 'Water Supply Issue in Block B', status: 'In Progress', time: '2 days ago' },
                { title: 'Library Book Shortage', status: 'Pending', time: '5 days ago' }
            ],
            upcomingEvents: [
                { title: 'Annual Sports Pitch Meeting', location: 'Committee Room', time: 'Oct 15, 10:00 AM' }
            ]
        });
    } catch (error) {
        console.error('Committee stats error:', error);
        res.status(500).json({ error: 'Failed to fetch committee statistics' });
    }
};
