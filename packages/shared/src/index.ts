import { z } from 'zod';

// Auth Schemas
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    display_name: z.string().min(3),
    role: z.enum(['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT', 'COMMITTEE']),
    phone: z.string().optional(),
});
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Student & Teacher Schemas
export const EnrollmentSchema = z.object({
    email: z.string().email(),
    display_name: z.string().min(3),
    phone: z.string().optional(),
    class: z.string(),
    section: z.string(),
    roll_number: z.coerce.number().int()
});
export const TeacherSchema = z.object({
    email: z.string().email(),
    display_name: z.string().min(3),
    phone: z.string().optional(),
    employee_id: z.string().min(1),
    subjects: z.array(z.string()),
    mpo_id: z.string().optional(),
});
export const LeaveSchema = z.object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    reason: z.string().min(1),
});

// Class & Attendance Schemas
export const ClassSchema = z.object({
    name: z.string().min(1),
    section: z.string().min(1),
    room_number: z.string().optional(),
    class_teacher_id: z.string().uuid().optional(),
});
export const AttendanceRecordSchema = z.object({
    student_id: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
});
export const MarkAttendanceSchema = z.object({
    date: z.coerce.date(),
    class_id: z.string().uuid(),
    records: z.array(AttendanceRecordSchema),
});

// Library Schemas
export const BookSchema = z.object({
    title: z.string().min(1),
    author: z.string().min(1),
    isbn: z.string().optional(),
    category: z.string().min(1),
    quantity: z.number().int().min(1),
    location: z.string().optional(),
    cover_url: z.string().url().optional().or(z.string().length(0)),
});
export const BorrowSchema = z.object({
    book_id: z.string().uuid(),
    user_id: z.string().uuid(),
    due_date: z.coerce.date(),
});

// Notice Schemas
export const NoticeSchema = z.object({
    title_en: z.string().min(1),
    title_bn: z.string().optional(),
    content_en: z.string().min(1),
    content_bn: z.string().optional(),
    target_roles: z.array(z.string()).optional(),
    target_classes: z.array(z.string()).optional(),
    urgent: z.boolean().default(false),
});

// Grievance & Feedback Schemas
export const GrievanceSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    anonymous: z.boolean().default(false),
});
export const FeedbackSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    message: z.string().min(1),
    rating: z.number().int().min(1).max(5),
});

// Scout Schemas
export const ScoutRegistrationSchema = z.object({
    student_id: z.string(),
    rank: z.string().optional(),
    badges: z.array(z.string()).optional(),
    join_date: z.coerce.date().optional(),
});
export const ScoutUpdateSchema = z.object({
    rank: z.string().optional(),
    badges: z.array(z.string()).optional(),
    camp_history: z.array(z.string()).optional(),
});

// Assignment & Submission Schemas
export const AssignmentSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    class: z.string().min(1),
    subject: z.string().min(1),
    due_date: z.coerce.date(),
    max_marks: z.number().int().min(1),
    file_url: z.string().optional(),
});
export const SubmissionSchema = z.object({
    assignment_id: z.string().uuid(),
    file_url: z.string().optional(),
    content: z.string().optional(),
});
export const GradeSchema = z.object({
    grade: z.string().min(1),
    remarks: z.string().optional(),
});

// Resource Schema
export const ResourceSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    class: z.string(),
    subject: z.string(),
    type: z.enum(['BOOK', 'HANDOUT', 'PRESENTATION', 'VIDEO', 'OTHER']),
});

// Types
export type Book = z.infer<typeof BookSchema> & { id: string; created_at: string; updated_at: string; available: number };
export type BorrowRecord = z.infer<typeof BorrowSchema> & { id: string; borrow_date: string; return_date?: string; status: string };
export type Notice = z.infer<typeof NoticeSchema> & { id: string; created_at: string; attachments?: string[] };
export type Grievance = z.infer<typeof GrievanceSchema> & { id: string; created_at: string; updated_at: string; status: string; assigned_to?: string; resolution?: string };
export type Feedback = z.infer<typeof FeedbackSchema> & { id: string; created_at: string };
export type Assignment = z.infer<typeof AssignmentSchema> & { id: string; created_at: string; created_by: string };
export type Submission = z.infer<typeof SubmissionSchema> & { id: string; submitted_at: string; grade?: string; remarks?: string };
export type Grade = z.infer<typeof GradeSchema>;
export type Teacher = z.infer<typeof TeacherSchema> & { user_id: string; leave_balance: number };
export type StudentEnrollment = z.infer<typeof EnrollmentSchema> & { user_id: string; student_id: string };
export type AttendanceMark = z.infer<typeof MarkAttendanceSchema>;
export type Class = z.infer<typeof ClassSchema> & { id: string };
