import { Request, Response } from 'express';
import { db } from '../../app';
import { logAction } from '../../utils/logger';
import { BookSchema, BorrowSchema } from '@school/shared';

export const addBook = async (req: Request, res: Response) => {
    try {
        const validation = BookSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { title, author, isbn, category, quantity, cover_url } = validation.data;

        const bookRes = await db.query(
            `INSERT INTO "Book" (title, author, isbn, category, quantity, available, cover_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [title, author, isbn, category, quantity, quantity, cover_url]
        );
        const book = bookRes.rows[0];

        await logAction((req as any).user.id, 'INFO', `New book added: ${title}`, {
            book_id: book.id,
            isbn
        });

        res.status(201).json(book);
    } catch (error) {
        console.error('Add book error:', error);
        res.status(500).json({ error: 'Failed to add book' });
    }
};

export const getBooks = async (req: Request, res: Response) => {
    try {
        const { search, category } = req.query;
        let queryText = 'SELECT * FROM "Book"';
        const queryParams = [];
        const whereClauses = [];

        if (category) {
            queryParams.push(category);
            whereClauses.push(`category = $${queryParams.length}`);
        }
        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(title ILIKE $${queryParams.length} OR author ILIKE $${queryParams.length})`);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        const booksRes = await db.query(queryText, queryParams);
        res.json(booksRes.rows);
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
};

export const borrowBook = async (req: Request, res: Response) => {
    try {
        const validation = BorrowSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Invalid input data', details: validation.error.format() });
        }

        const { book_id, user_id, due_date } = validation.data;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const bookRes = await client.query('SELECT * FROM "Book" WHERE id = $1 FOR UPDATE', [book_id]);
            const book = bookRes.rows[0];

            if (!book || book.available <= 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Book not available for borrowing' });
            }

            const recordRes = await client.query(
                `INSERT INTO "BorrowRecord" (book_id, user_id, due_date, status) 
                 VALUES ($1, $2, $3, 'BORROWED') RETURNING *`,
                [book_id, user_id, due_date]
            );
            const record = recordRes.rows[0];

            await client.query('UPDATE "Book" SET available = available - 1 WHERE id = $1', [book_id]);

            await client.query('COMMIT');

            await logAction(user_id, 'INFO', `Book borrowed: ${book.title}`, {
                book_id,
                record_id: record.id
            });

            res.status(201).json(record);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Borrow book error:', error);
        res.status(500).json({ error: 'Failed to process borrowing' });
    }
};

export const returnBook = async (req: Request, res: Response) => {
    try {
        const { record_id } = req.params;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const recordRes = await client.query('SELECT * FROM "BorrowRecord" WHERE id = $1 FOR UPDATE', [record_id]);
            const record = recordRes.rows[0];

            if (!record || record.return_date) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Invalid or already returned record' });
            }

            const updatedRecordRes = await client.query(
                'UPDATE "BorrowRecord" SET return_date = $1, status = \'RETURNED\' WHERE id = $2 RETURNING *',
                [new Date(), record_id]
            );

            await client.query('UPDATE "Book" SET available = available + 1 WHERE id = $1', [record.book_id]);

            await client.query('COMMIT');

            await logAction(record.user_id, 'INFO', `Book returned.`, {
                record_id,
                book_id: record.book_id
            });

            res.json({ message: 'Book returned successfully' });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Return book error:', error);
        res.status(500).json({ error: 'Failed to process return' });
    }
};
