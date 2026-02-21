import { Request, Response } from 'express';
import { db } from '../../app';
import { logAction } from '../../utils/logger';
import { ResourceSchema } from '@school/shared';

export const uploadResource = async (req: Request, res: Response) => {
    try {
        const { title, description, class: className, subject, type } = req.body;
        const user = (req as any).user;
        const file = req.file;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const resourceRes = await db.query(
            `INSERT INTO "Resource" (title, description, class, subject, type, file_url, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, description, className, subject, type, `/uploads/${file.filename}`, user.id]
        );
        const resource = resourceRes.rows[0];

        await logAction(user.id, 'INFO', `New resource uploaded: ${title}`, {
            resource_id: resource.id,
            subject,
            class: className
        });

        res.status(201).json(resource);
    } catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({ error: 'Failed to upload resource' });
    }
};

export const getResources = async (req: Request, res: Response) => {
    try {
        const { class: className, subject } = req.query;
        let queryText = 'SELECT r.*, u.display_name as uploader_name FROM "Resource" r JOIN "User" u ON r.uploaded_by = u.id';
        const queryParams = [];
        const whereClauses = [];

        if (className) {
            queryParams.push(className);
            whereClauses.push(`r.class = $${queryParams.length}`);
        }
        if (subject) {
            queryParams.push(subject);
            whereClauses.push(`r.subject = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        const resourcesRes = await db.query(queryText, queryParams);
        res.json(resourcesRes.rows);
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
};
