import { Request, Response } from 'express';
import { db } from '../../app';
import { translateNotice } from '../../services/gemini.service';
import { io } from '../../server';
import { logAction } from '../../utils/logger';
import { NoticeSchema } from '@school/shared';

export const createNotice = async (req: Request, res: Response) => {
    try {
        const { title_en, title_bn, content_en, content_bn, target_roles, target_classes, urgent } = req.body;
        const user = (req as any).user;

        let final_title_en = title_en;
        let final_title_bn = title_bn;
        let final_content_en = content_en;
        let final_content_bn = content_bn;

        if (!final_title_bn && final_title_en) final_title_bn = await translateNotice(final_title_en, 'Bangla') || '';
        if (!final_title_en && final_title_bn) final_title_en = await translateNotice(final_title_bn, 'English') || '';
        if (!final_content_bn && final_content_en) final_content_bn = await translateNotice(final_content_en, 'Bangla') || '';
        if (!final_content_en && final_content_bn) final_content_en = await translateNotice(final_content_bn, 'English') || '';

        const noticeRes = await db.query(
            `INSERT INTO "Notice" (title_en, title_bn, content_en, content_bn, target_roles, target_classes, urgent, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [final_title_en, final_title_bn, final_content_en, final_content_bn, target_roles, target_classes, urgent, user.id]
        );
        const notice = noticeRes.rows[0];

        io.emit('new-notice', notice);

        await logAction(user.id, 'INFO', `New notice issued: ${final_title_en}`, {
            notice_id: notice.id,
            urgent
        });

        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notice' });
    }
};

export const getNotices = async (req: Request, res: Response) => {
    try {
        const noticesRes = await db.query('SELECT * FROM "Notice" ORDER BY created_at DESC');
        res.json(noticesRes.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
};
