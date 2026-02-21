import { db } from '../app';
import { io } from '../server';

export const logAction = async (
    userId: string | null,
    level: string,
    message: string,
    metadata: any = {},
    ip_address?: string
) => {
    try {
        const logRes = await db.query(
            'INSERT INTO "SystemLog" (level, message, action, performed_by, ip_address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [level, message, level, userId, ip_address]
        );
        const log = logRes.rows[0];
        io.to('admin-room').emit('log-update', log);
    } catch (error) {
        console.error('Failed to write system log:', error);
    }
};
