import { Request, Response } from 'express';
import { db } from '../../app';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // 1. Get Parent's associated students
        const studentsRes = await db.query(`
            SELECT s.user_id, s.class, u.display_name 
            FROM "ParentStudent" ps 
            JOIN "Student" s ON ps.student_id = s.user_id 
            JOIN "User" u ON s.user_id = u.id 
            WHERE ps.parent_id = $1
        `, [userId]);

        const children = studentsRes.rows;
        const childrenIds = children.map(c => c.user_id);

        let overallAttendance = '100%';
        if (childrenIds.length > 0) {
            const attendanceRes = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
                FROM "Attendance" 
                WHERE student_id = ANY($1)
            `, [childrenIds]);

            const total = parseInt(attendanceRes.rows[0].total) || 0;
            const present = parseInt(attendanceRes.rows[0].present) || 0;
            if (total > 0) {
                overallAttendance = Math.round((present / total) * 100) + '%';
            }
        }

        res.json({
            childrenEnrolled: children.length,
            averageAttendance: overallAttendance,
            pendingFees: '৳ 0', // Mock
            notices: 1, // Mock
            children: children.map(c => ({
                id: c.user_id,
                name: c.display_name,
                class: c.class,
                status: 'Present Today' // Mock
            })),
            announcements: [
                { title: 'Parent-Teacher Meeting', description: 'Next Saturday at 10:00 AM.' }
            ]
        });
    } catch (error) {
        console.error('Get parent dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch parent stats' });
    }
};
