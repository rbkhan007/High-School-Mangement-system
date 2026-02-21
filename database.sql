-- ═══════════════════════════════════════════════════════════════════════════════
-- BASUDEVPUR HIGH SCHOOL MANAGEMENT SYSTEM - COMPLETE PRODUCTION SCHEMA
-- Version: 1.0.0 | Encoding: UTF8 | PostgreSQL 14+
-- ═══════════════════════════════════════════════════════════════════════════════

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ EXTENSIONS & CONFIGURATIONS                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For encryption functions

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ CUSTOM ENUMERATIONS                                                          │
-- └─────────────────────────────────────────────────────────────────────────────┘

DROP TYPE IF EXISTS "Role" CASCADE;
CREATE TYPE "Role" AS ENUM ('HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT', 'COMMITTEE', 'STAFF');

DROP TYPE IF EXISTS "AttendanceStatus" CASCADE;
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

DROP TYPE IF EXISTS "GrievanceStatus" CASCADE;
CREATE TYPE "GrievanceStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'REJECTED');

DROP TYPE IF EXISTS "LeaveStatus" CASCADE;
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

DROP TYPE IF EXISTS "BorrowStatus" CASCADE;
CREATE TYPE "BorrowStatus" AS ENUM ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST');

DROP TYPE IF EXISTS "LogLevel" CASCADE;
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

DROP TYPE IF EXISTS "Gender" CASCADE;
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ HELPER FUNCTIONS & TRIGGERS                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Log user actions (SECURE - no sensitive data)
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO "SystemLog" (level, message, action, performed_by, ip_address, entity_type, entity_id)
        VALUES ('INFO', 'User profile updated', 'UPDATE_USER', NEW.id, inet_client_addr()::TEXT, 'User', NEW.id);
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO "SystemLog" (level, message, action, performed_by, ip_address, entity_type, entity_id)
        VALUES ('WARNING', 'User account deleted', 'DELETE_USER', OLD.id, inet_client_addr()::TEXT, 'User', OLD.id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Update book availability on borrow/return
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'BORROWED') THEN
        UPDATE "Book" 
        SET "available" = GREATEST(0, "available" - 1) 
        WHERE "id" = NEW.book_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'RETURNED' AND OLD.status = 'BORROWED') THEN
        UPDATE "Book" 
        SET "available" = LEAST("quantity", "available" + 1) 
        WHERE "id" = NEW.book_id;
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'LOST' AND OLD.status = 'BORROWED') THEN
        UPDATE "Book" 
        SET "quantity" = GREATEST(0, "quantity" - 1),
            "available" = GREATEST(0, "available" - 1)
        WHERE "id" = NEW.book_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Prevent overlapping leave requests
CREATE OR REPLACE FUNCTION check_leave_overlap()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO overlap_count
    FROM "LeaveRequest"
    WHERE "teacher_id" = NEW.teacher_id
    AND "status" IN ('PENDING', 'APPROVED')
    AND "id" != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
        (NEW.start_date BETWEEN "start_date" AND "end_date") OR
        (NEW.end_date BETWEEN "start_date" AND "end_date") OR
        ("start_date" BETWEEN NEW.start_date AND NEW.end_date)
    );

    IF overlap_count > 0 THEN
        RAISE EXCEPTION 'Leave request overlaps with existing approved/pending leave';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-calculate grade based on marks
CREATE OR REPLACE FUNCTION calculate_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Assuming percentage-based grading
    IF NEW.marks_obtained >= 80 THEN
        NEW.grade = 'A+';
    ELSIF NEW.marks_obtained >= 70 THEN
        NEW.grade = 'A';
    ELSIF NEW.marks_obtained >= 60 THEN
        NEW.grade = 'A-';
    ELSIF NEW.marks_obtained >= 50 THEN
        NEW.grade = 'B';
    ELSIF NEW.marks_obtained >= 40 THEN
        NEW.grade = 'C';
    ELSIF NEW.marks_obtained >= 33 THEN
        NEW.grade = 'D';
    ELSE
        NEW.grade = 'F';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ CORE TABLES                                                                  │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Academic Year Management
CREATE TABLE "AcademicYear" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "year_name" VARCHAR(50) NOT NULL UNIQUE, -- e.g., "2024-2025"
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_academic_year_dates CHECK ("end_date" > "start_date")
);

-- User Management (Central Authentication)
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(20),
    "display_name" VARCHAR(255) NOT NULL,
    "photo_url" TEXT,
    "role" "Role" NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,  -- Renamed from "password" for clarity
    "gender" "Gender",
    "date_of_birth" DATE,
    "address" TEXT,
    "emergency_contact" VARCHAR(20),
    "is_approved" BOOLEAN DEFAULT FALSE,
    "is_active" BOOLEAN DEFAULT TRUE,
    "email_verified" BOOLEAN DEFAULT FALSE,
    "phone_verified" BOOLEAN DEFAULT FALSE,
    "last_login_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP WITH TIME ZONE,  -- Soft delete support
    CONSTRAINT valid_email CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Student Profile
CREATE TABLE "Student" (
    "user_id" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
    "student_id" VARCHAR(50) UNIQUE NOT NULL,
    "class" VARCHAR(50) NOT NULL,
    "section" VARCHAR(50) NOT NULL,
    "roll_number" INTEGER NOT NULL,
    "academic_year_id" UUID REFERENCES "AcademicYear"("id"),
    "guardian_ids" UUID[], -- Array of parent user IDs
    "blood_group" VARCHAR(10),
    "admission_date" DATE DEFAULT CURRENT_DATE,
    "previous_school" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_roll_number CHECK ("roll_number" > 0)
);

-- Teacher Profile
CREATE TABLE "Teacher" (
    "user_id" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
    "employee_id" VARCHAR(50) UNIQUE NOT NULL,
    "subjects" TEXT[],
    "qualifications" TEXT[],
    "mpo_id" VARCHAR(50),
    "join_date" DATE NOT NULL,
    "leave_balance" INTEGER DEFAULT 20,
    "total_leave_days" INTEGER DEFAULT 20,
    "department" VARCHAR(100),
    "designation" VARCHAR(100) DEFAULT 'Assistant Teacher',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_leave_balance CHECK ("leave_balance" >= 0)
);

-- Parent Profile
CREATE TABLE "Parent" (
    "user_id" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
    "occupation" VARCHAR(100),
    "relationship" VARCHAR(50), -- Father, Mother, Guardian
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parent-Student Relationship
CREATE TABLE "ParentStudent" (
    "parent_id" UUID REFERENCES "Parent"("user_id") ON DELETE CASCADE,
    "student_id" UUID REFERENCES "Student"("user_id") ON DELETE CASCADE,
    "relationship" VARCHAR(50) DEFAULT 'Father', -- Father, Mother, Guardian
    "is_primary_contact" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("parent_id", "student_id")
);

-- Class Management
CREATE TABLE "Class" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "section" VARCHAR(100) NOT NULL,
    "room_number" VARCHAR(50),
    "class_teacher_id" UUID REFERENCES "Teacher"("user_id") ON DELETE SET NULL,
    "academic_year_id" UUID REFERENCES "AcademicYear"("id"),
    "capacity" INTEGER DEFAULT 40,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("name", "section", "academic_year_id")
);

-- Class Routine/Schedule
CREATE TABLE "Routine" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "class_id" UUID REFERENCES "Class"("id") ON DELETE CASCADE,
    "day" VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
    "period_number" INTEGER NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "teacher_id" UUID REFERENCES "Teacher"("user_id") ON DELETE CASCADE,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "room_number" VARCHAR(50),
    "academic_year_id" UUID REFERENCES "AcademicYear"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_period_number CHECK ("period_number" > 0 AND "period_number" <= 10),
    CONSTRAINT valid_time_range CHECK ("end_time" > "start_time"),
    UNIQUE("class_id", "day", "period_number", "academic_year_id")
);

-- Attendance Management
CREATE TABLE "Attendance" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "class_id" UUID REFERENCES "Class"("id") ON DELETE CASCADE,
    "student_id" UUID REFERENCES "Student"("user_id") ON DELETE CASCADE,
    "status" "AttendanceStatus" NOT NULL,
    "marked_by" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "marked_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "remarks" VARCHAR(255),
    "academic_year_id" UUID REFERENCES "AcademicYear"("id"),
    UNIQUE("date", "student_id", "class_id")
);

-- Exam Management
CREATE TABLE "Exam" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "class_id" UUID REFERENCES "Class"("id") ON DELETE CASCADE,
    "type" VARCHAR(100) NOT NULL, -- Mid-term, Final, Quiz, etc.
    "max_marks" INTEGER NOT NULL,
    "passing_marks" INTEGER DEFAULT 33,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_by" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "academic_year_id" UUID REFERENCES "AcademicYear"("id"),
    "published" BOOLEAN DEFAULT FALSE,
    "publish_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_exam_dates CHECK ("end_date" >= "start_date"),
    CONSTRAINT valid_max_marks CHECK ("max_marks" > 0),
    CONSTRAINT valid_passing_marks CHECK ("passing_marks" > 0 AND "passing_marks" <= "max_marks")
);

-- Marks/Grades
CREATE TABLE "Mark" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "exam_id" UUID REFERENCES "Exam"("id") ON DELETE CASCADE,
    "student_id" UUID REFERENCES "Student"("user_id") ON DELETE CASCADE,
    "subject" VARCHAR(100) NOT NULL,
    "marks_obtained" NUMERIC(5,2) NOT NULL,
    "grade" VARCHAR(10),
    "remarks" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_marks_range CHECK ("marks_obtained" >= 0),
    UNIQUE("exam_id", "student_id", "subject")
);

-- Notice/Announcement Board
CREATE TABLE "Notice" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title_en" VARCHAR(255) NOT NULL,
    "title_bn" VARCHAR(255) NOT NULL,
    "content_en" TEXT NOT NULL,
    "content_bn" TEXT NOT NULL,
    "target_roles" "Role"[],
    "target_classes" UUID[],  -- Changed to UUID array for Class references
    "attachments" TEXT[],
    "created_by" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP WITH TIME ZONE,
    "urgent" BOOLEAN DEFAULT FALSE,
    "is_pinned" BOOLEAN DEFAULT FALSE,
    "view_count" INTEGER DEFAULT 0
);

-- Notice Read Receipts
CREATE TABLE "NoticeReadReceipt" (
    "notice_id" UUID REFERENCES "Notice"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "read_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    PRIMARY KEY ("notice_id", "user_id")
);

-- Grievance/Complaint Management
CREATE TABLE "Grievance" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ticket_number" VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "priority" VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    "submitted_by" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "anonymous" BOOLEAN DEFAULT FALSE,
    "status" "GrievanceStatus" DEFAULT 'PENDING',
    "assigned_to" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "resolution" TEXT,
    "resolution_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Resources
CREATE TABLE "Resource" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "class_id" UUID REFERENCES "Class"("id"), -- Changed from VARCHAR to UUID
    "subject" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL, -- PDF, Video, Link, Document
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "file_size" BIGINT,
    "mime_type" VARCHAR(100),
    "uploaded_by" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "download_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Push Notifications
CREATE TABLE "Notification" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "type" VARCHAR(50) DEFAULT 'GENERAL', -- EXAM, NOTICE, ATTENDANCE, etc.
    "is_read" BOOLEAN DEFAULT FALSE,
    "read_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Public Feedback/Contact Form
CREATE TABLE "Feedback" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "subject" VARCHAR(255),
    "message" TEXT NOT NULL,
    "rating" INTEGER CHECK ("rating" >= 1 AND "rating" <= 5),
    "is_resolved" BOOLEAN DEFAULT FALSE,
    "resolved_by" UUID REFERENCES "User"("id"),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Request Management
CREATE TABLE "LeaveRequest" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "teacher_id" UUID REFERENCES "Teacher"("user_id") ON DELETE CASCADE,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "leave_type" VARCHAR(50) DEFAULT 'CASUAL', -- CASUAL, SICK, EMERGENCY, MATERNITY
    "status" "LeaveStatus" DEFAULT 'PENDING',
    "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID REFERENCES "User"("id") ON DELETE SET NULL,
    "approved_at" TIMESTAMP WITH TIME ZONE,
    "rejection_reason" TEXT,
    "days_requested" INTEGER GENERATED ALWAYS AS ("end_date" - "start_date" + 1) STORED,
    CONSTRAINT valid_leave_dates CHECK ("end_date" >= "start_date")
);

-- Scout/Guide Activities
CREATE TABLE "ScoutMember" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "student_id" UUID UNIQUE REFERENCES "Student"("user_id") ON DELETE CASCADE,
    "membership_id" VARCHAR(50) UNIQUE,
    "unit" VARCHAR(100) DEFAULT 'Scout', -- Scout, Guide, Rover, Ranger
    "rank" VARCHAR(100) DEFAULT 'Member',
    "badges" JSONB, -- Store badge details as JSON
    "join_date" DATE DEFAULT CURRENT_DATE,
    "camp_history" JSONB,
    "achievements" TEXT[],
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Management
CREATE TABLE "Assignment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "class_id" UUID REFERENCES "Class"("id"), -- Changed from VARCHAR to UUID
    "subject" VARCHAR(100) NOT NULL,
    "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "max_marks" INTEGER NOT NULL,
    "passing_marks" INTEGER DEFAULT 0,
    "file_url" TEXT,
    "allow_late_submission" BOOLEAN DEFAULT FALSE,
    "created_by" UUID REFERENCES "Teacher"("user_id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Submissions
CREATE TABLE "Submission" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "assignment_id" UUID REFERENCES "Assignment"("id") ON DELETE CASCADE,
    "student_id" UUID REFERENCES "Student"("user_id") ON DELETE CASCADE,
    "file_url" TEXT,
    "content" TEXT,
    "is_late" BOOLEAN DEFAULT FALSE,
    "submitted_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "grade" NUMERIC(5,2),
    "grade_points" INTEGER,
    "remarks" TEXT,
    "graded_by" UUID REFERENCES "User"("id"),
    "graded_at" TIMESTAMP WITH TIME ZONE,
    UNIQUE("assignment_id", "student_id")
);

-- System Audit Logs
CREATE TABLE "SystemLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "action" VARCHAR(100),
    "performed_by" UUID,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Library Management
CREATE TABLE "Book" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "author" VARCHAR(255) NOT NULL,
    "isbn" VARCHAR(50) UNIQUE,
    "publisher" VARCHAR(255),
    "publication_year" INTEGER,
    "edition" VARCHAR(50),
    "category" VARCHAR(100) NOT NULL,
    "subcategory" VARCHAR(100),
    "quantity" INTEGER DEFAULT 1,
    "available" INTEGER DEFAULT 1,
    "location" VARCHAR(255),
    "cover_url" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "added_by" UUID REFERENCES "User"("id"),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_book_quantity CHECK ("quantity" >= 0),
    CONSTRAINT valid_book_available CHECK ("available" >= 0 AND "available" <= "quantity")
);

-- Book Borrow Records
CREATE TABLE "BorrowRecord" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "book_id" UUID REFERENCES "Book"("id") ON DELETE CASCADE,
    "user_id" UUID REFERENCES "User"("id") ON DELETE CASCADE,
    "borrow_date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "return_date" TIMESTAMP WITH TIME ZONE,
    "status" "BorrowStatus" DEFAULT 'BORROWED',
    "fine_amount" NUMERIC(10,2) DEFAULT 0,
    "fine_paid" BOOLEAN DEFAULT FALSE,
    "issued_by" UUID REFERENCES "User"("id"),
    "received_by" UUID REFERENCES "User"("id"),
    "renewal_count" INTEGER DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT valid_due_date CHECK ("due_date" > "borrow_date")
);

-- Schema Version Tracking (for migrations)
CREATE TABLE "SchemaVersion" (
    "version" VARCHAR(50) PRIMARY KEY,
    "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "applied_by" VARCHAR(100) NOT NULL,
    "checksum" VARCHAR(64)
);

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ INDEXES FOR PERFORMANCE                                                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- User indexes
CREATE INDEX idx_user_email ON "User"("email");
CREATE INDEX idx_user_email_lower ON "User"(LOWER("email"));
CREATE INDEX idx_user_role ON "User"("role") WHERE "is_active" = TRUE;
CREATE INDEX idx_user_active ON "User"("is_active", "is_approved") WHERE "deleted_at" IS NULL;

-- Student indexes
CREATE INDEX idx_student_class_section ON "Student"("class", "section");
CREATE INDEX idx_student_roll ON "Student"("class", "section", "roll_number");
CREATE INDEX idx_student_academic_year ON "Student"("academic_year_id");

-- Attendance indexes
CREATE INDEX idx_attendance_date ON "Attendance"("date");
CREATE INDEX idx_attendance_student ON "Attendance"("student_id", "date");
CREATE INDEX idx_attendance_class_date ON "Attendance"("class_id", "date");
CREATE INDEX idx_attendance_academic_year ON "Attendance"("academic_year_id");

-- Exam and Marks indexes
CREATE INDEX idx_exam_class ON "Exam"("class_id");
CREATE INDEX idx_exam_academic_year ON "Exam"("academic_year_id");
CREATE INDEX idx_exam_published ON "Exam"("published", "publish_date");
CREATE INDEX idx_mark_student ON "Mark"("student_id");
CREATE INDEX idx_mark_exam ON "Mark"("exam_id");

-- Notice indexes
CREATE INDEX idx_notice_created_at ON "Notice"("created_at" DESC);
CREATE INDEX idx_notice_urgent ON "Notice"("urgent", "created_at") WHERE "urgent" = TRUE;
CREATE INDEX idx_notice_expires ON "Notice"("expires_at") WHERE "expires_at" > CURRENT_TIMESTAMP;

-- Grievance indexes
CREATE INDEX idx_grievance_status ON "Grievance"("status") WHERE "status" IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS');
CREATE INDEX idx_grievance_submitted ON "Grievance"("submitted_by", "created_at");

-- Assignment indexes
CREATE INDEX idx_assignment_class ON "Assignment"("class_id");
CREATE INDEX idx_assignment_due ON "Assignment"("due_date") WHERE "due_date" > CURRENT_TIMESTAMP;

-- Submission indexes
CREATE INDEX idx_submission_assignment ON "Submission"("assignment_id");
CREATE INDEX idx_submission_student ON "Submission"("student_id");

-- Library indexes
CREATE INDEX idx_book_isbn ON "Book"("isbn");
CREATE INDEX idx_book_title ON "Book"(LOWER("title"));
CREATE INDEX idx_book_category ON "Book"("category", "subcategory");
CREATE INDEX idx_book_available ON "Book"("available") WHERE "available" > 0;
CREATE INDEX idx_borrow_user ON "BorrowRecord"("user_id");
CREATE INDEX idx_borrow_book ON "BorrowRecord"("book_id");
CREATE INDEX idx_borrow_status ON "BorrowRecord"("status") WHERE "status" = 'BORROWED';
CREATE INDEX idx_borrow_overdue ON "BorrowRecord"("due_date") WHERE "status" = 'BORROWED' AND "due_date" < CURRENT_TIMESTAMP;

-- Notification indexes
CREATE INDEX idx_notification_user ON "Notification"("user_id", "created_at" DESC);
CREATE INDEX idx_notification_unread ON "Notification"("user_id") WHERE "is_read" = FALSE;

-- System Log indexes
CREATE INDEX idx_systemlog_created ON "SystemLog"("created_at" DESC);
CREATE INDEX idx_systemlog_level ON "SystemLog"("level") WHERE "level" IN ('ERROR', 'CRITICAL');
CREATE INDEX idx_systemlog_action ON "SystemLog"("action", "created_at");

-- Leave Request indexes
CREATE INDEX idx_leave_teacher ON "LeaveRequest"("teacher_id", "applied_at" DESC);
CREATE INDEX idx_leave_status ON "LeaveRequest"("status") WHERE "status" = 'PENDING';

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ TRIGGERS                                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Auto-update timestamps
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON "User" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_student_updated_at BEFORE UPDATE ON "Student" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_teacher_updated_at BEFORE UPDATE ON "Teacher" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_parent_updated_at BEFORE UPDATE ON "Parent" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_class_updated_at BEFORE UPDATE ON "Class" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_routine_updated_at BEFORE UPDATE ON "Routine" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_exam_updated_at BEFORE UPDATE ON "Exam" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_mark_updated_at BEFORE UPDATE ON "Mark" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_grievance_updated_at BEFORE UPDATE ON "Grievance" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_resource_updated_at BEFORE UPDATE ON "Resource" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_feedback_updated_at BEFORE UPDATE ON "Feedback" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_book_updated_at BEFORE UPDATE ON "Book" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_assignment_updated_at BEFORE UPDATE ON "Assignment" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_scout_updated_at BEFORE UPDATE ON "ScoutMember" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_academic_year_updated_at BEFORE UPDATE ON "AcademicYear" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Secure audit logging
CREATE TRIGGER trg_user_audit AFTER UPDATE OR DELETE ON "User" 
    FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- Book availability management
CREATE TRIGGER trg_book_availability AFTER INSERT OR UPDATE ON "BorrowRecord" 
    FOR EACH ROW EXECUTE FUNCTION update_book_availability();

-- Leave overlap prevention
CREATE TRIGGER trg_check_leave_overlap BEFORE INSERT OR UPDATE ON "LeaveRequest" 
    FOR EACH ROW EXECUTE FUNCTION check_leave_overlap();

-- Auto-calculate grade before insert/update
CREATE TRIGGER trg_calculate_grade BEFORE INSERT OR UPDATE ON "Mark" 
    FOR EACH ROW EXECUTE FUNCTION calculate_grade();

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ SEED DATA - INITIAL SETUP                                                    │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- 1. Create Current Academic Year
INSERT INTO "AcademicYear" ("id", "year_name", "start_date", "end_date", "is_current")
VALUES ('10000000-0000-0000-0000-000000000001', '2024-2025', '2024-01-01', '2024-12-31', TRUE);

-- 2. Create Headmaster (Password: headmaster123 - bcrypt hashed)
-- Note: In production, use proper bcrypt hashing. This is a placeholder hash.
INSERT INTO "User" ("id", "email", "display_name", "role", "password_hash", "is_approved", "is_active", "gender")
VALUES ('00000000-0000-0000-0000-000000000001', 'headmaster@basudevpur.edu.bd', 'Headmaster / প্রধান শিক্ষক', 'HEADMASTER', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'MALE');

-- 3. Create Classes (Class 6-10, Section A)
INSERT INTO "Class" ("id", "name", "section", "room_number", "academic_year_id", "capacity")
VALUES 
    ('00000000-0000-0000-0000-000000000010', 'Class 6', 'Section A', '101', '10000000-0000-0000-0000-000000000001', 40),
    ('00000000-0000-0000-0000-000000000011', 'Class 7', 'Section A', '102', '10000000-0000-0000-0000-000000000001', 40),
    ('00000000-0000-0000-0000-000000000012', 'Class 8', 'Section A', '103', '10000000-0000-0000-0000-000000000001', 40),
    ('00000000-0000-0000-0000-000000000013', 'Class 9', 'Section A', '104', '10000000-0000-0000-0000-000000000001', 40),
    ('00000000-0000-0000-0000-000000000014', 'Class 10', 'Section A', '105', '10000000-0000-0000-0000-000000000001', 40);

-- 4. Create Teachers
INSERT INTO "User" ("id", "email", "display_name", "role", "password_hash", "is_approved", "is_active", "gender")
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'kamal.uddin@basudevpur.edu.bd', 'Kamal Uddin', 'TEACHER', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'MALE'),
    ('00000000-0000-0000-0000-000000000004', 'nusrat.jahan@basudevpur.edu.bd', 'Nusrat Jahan', 'TEACHER', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'FEMALE');

INSERT INTO "Teacher" ("user_id", "employee_id", "subjects", "mpo_id", "join_date", "department", "designation")
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'BHS-T001', ARRAY['Mathematics', 'Physics'], 'MPO-2024-001', '2020-01-15', 'Science', 'Senior Teacher'),
    ('00000000-0000-0000-0000-000000000004', 'BHS-T002', ARRAY['English', 'Literature'], 'MPO-2024-002', '2019-03-10', 'Arts', 'Assistant Teacher');

-- Assign Class Teachers
UPDATE "Class" SET "class_teacher_id" = '00000000-0000-0000-0000-000000000002' 
WHERE "id" = '00000000-0000-0000-0000-000000000010';
UPDATE "Class" SET "class_teacher_id" = '00000000-0000-0000-0000-000000000004' 
WHERE "id" = '00000000-0000-0000-0000-000000000011';

-- 5. Create Students
INSERT INTO "User" ("id", "email", "display_name", "role", "password_hash", "is_approved", "is_active", "gender")
VALUES 
    ('00000000-0000-0000-0000-000000000003', 'rahim.ahmed@student.basudevpur.edu.bd', 'Rahim Ahmed', 'STUDENT', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'MALE'),
    ('00000000-0000-0000-0000-000000000005', 'karim.ali@student.basudevpur.edu.bd', 'Karim Ali', 'STUDENT', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'MALE'),
    ('00000000-0000-0000-0000-000000000006', 'sumi.akter@student.basudevpur.edu.bd', 'Sumi Akter', 'STUDENT', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'FEMALE');

INSERT INTO "Student" ("user_id", "student_id", "class", "section", "roll_number", "academic_year_id", "blood_group", "admission_date")
VALUES 
    ('00000000-0000-0000-0000-000000000003', 'BHS-2024-6-001', 'Class 6', 'Section A', 1, '10000000-0000-0000-0000-000000000001', 'A+', '2024-01-05'),
    ('00000000-0000-0000-0000-000000000005', 'BHS-2024-6-002', 'Class 6', 'Section A', 2, '10000000-0000-0000-0000-000000000001', 'B+', '2024-01-05'),
    ('00000000-0000-0000-0000-000000000006', 'BHS-2024-7-001', 'Class 7', 'Section A', 1, '10000000-0000-0000-0000-000000000001', 'O+', '2023-01-10');

-- 6. Create Parents
INSERT INTO "User" ("id", "email", "display_name", "role", "password_hash", "is_approved", "is_active", "gender", "phone")
VALUES 
    ('00000000-0000-0000-0000-000000000007', 'parent1@example.com', 'Mr. Ahmed (Parent)', 'PARENT', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'MALE', '01712345678'),
    ('00000000-0000-0000-0000-000000000008', 'parent2@example.com', 'Mrs. Akter (Parent)', 'PARENT', '$2b$10$vI8A7ugYvjDRE9.1H18BQuXG2kK0vD2D2D2D2D2D2D2D2D2D2D2D2D', TRUE, TRUE, 'FEMALE', '01812345678');

INSERT INTO "Parent" ("user_id", "occupation", "relationship")
VALUES 
    ('00000000-0000-0000-0000-000000000007', 'Businessman', 'Father'),
    ('00000000-0000-0000-0000-000000000008', 'Housewife', 'Mother');

-- Link Parents to Students
INSERT INTO "ParentStudent" ("parent_id", "student_id", "relationship", "is_primary_contact")
VALUES 
    ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Father', TRUE),
    ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', 'Mother', TRUE);

-- 7. Create Sample Library Books
INSERT INTO "Book" ("id", "title", "author", "isbn", "category", "quantity", "available", "location", "added_by")
VALUES 
    ('00000000-0000-0000-0000-000000000020', 'Higher Math Part 1', 'Prof. Abdur Rahman', '978-984-1234-1', 'Textbook', 5, 5, 'Library Shelf A1', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000021', 'English Grammar', 'Wren & Martin', '978-984-1234-2', 'Reference', 3, 3, 'Library Shelf B2', '00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000022', 'Bangladesh Studies', 'Dr. Kamal Hossain', '978-984-1234-3', 'Textbook', 10, 10, 'Library Shelf C1', '00000000-0000-0000-0000-000000000001');

-- 8. Record Schema Version
INSERT INTO "SchemaVersion" ("version", "description", "applied_by", "checksum")
VALUES ('1.0.0', 'Initial schema setup with seed data', 'system', 'initial_setup');

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ VIEWS FOR COMMON QUERIES                                                     │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- View: Active Users Only
CREATE OR REPLACE VIEW "ActiveUsers" AS
SELECT * FROM "User" WHERE "deleted_at" IS NULL AND "is_active" = TRUE;

-- View: Students with Parent Info
CREATE OR REPLACE VIEW "StudentParentView" AS
SELECT 
    s.*, 
    u."display_name" as student_name,
    u."email" as student_email,
    u."phone" as student_phone,
    array_agg(p."user_id") as parent_ids,
    array_agg(p_u."display_name") as parent_names
FROM "Student" s
JOIN "User" u ON s."user_id" = u."id"
LEFT JOIN "ParentStudent" ps ON s."user_id" = ps."student_id"
LEFT JOIN "Parent" p ON ps."parent_id" = p."user_id"
LEFT JOIN "User" p_u ON p."user_id" = p_u."id"
WHERE s."deleted_at" IS NULL
GROUP BY s."user_id", u."display_name", u."email", u."phone";

-- View: Overdue Books
CREATE OR REPLACE VIEW "OverdueBooks" AS
SELECT 
    br.*, 
    b."title" as book_title,
    b."isbn",
    u."display_name" as borrower_name,
    u."email" as borrower_email,
    CURRENT_DATE - br."due_date"::DATE as days_overdue
FROM "BorrowRecord" br
JOIN "Book" b ON br."book_id" = b."id"
JOIN "User" u ON br."user_id" = u."id"
WHERE br."status" = 'BORROWED' AND br."due_date" < CURRENT_TIMESTAMP;

-- View: Class Routine with Teacher Names
CREATE OR REPLACE VIEW "ClassRoutineView" AS
SELECT 
    r.*,
    c."name" as class_name,
    c."section",
    u."display_name" as teacher_name,
    t."employee_id"
FROM "Routine" r
JOIN "Class" c ON r."class_id" = c."id"
JOIN "Teacher" t ON r."teacher_id" = t."user_id"
JOIN "User" u ON t."user_id" = u."id";

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ STORED PROCEDURES FOR COMMON OPERATIONS                                      │
-- └─────────────────────────────────────────────────────────────────────────────┘

-- Procedure: Mark attendance for a whole class
CREATE OR REPLACE PROCEDURE mark_class_attendance(
    p_date DATE,
    p_class_id UUID,
    p_attendance_data JSONB, -- [{"student_id": "uuid", "status": "PRESENT"}, ...]
    p_marked_by UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    academic_year UUID;
BEGIN
    -- Get current academic year
    SELECT "id" INTO academic_year FROM "AcademicYear" WHERE "is_current" = TRUE LIMIT 1;

    FOR rec IN SELECT * FROM jsonb_to_recordset(p_attendance_data) AS x(student_id UUID, status "AttendanceStatus")
    LOOP
        INSERT INTO "Attendance" ("date", "class_id", "student_id", "status", "marked_by", "academic_year_id")
        VALUES (p_date, p_class_id, rec.student_id, rec.status, p_marked_by, academic_year)
        ON CONFLICT ("date", "student_id", "class_id") 
        DO UPDATE SET "status" = rec.status, "marked_by" = p_marked_by, "marked_at" = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$;

-- Procedure: Process leave approval with balance update
CREATE OR REPLACE PROCEDURE approve_leave_request(
    p_leave_id UUID,
    p_approved_by UUID,
    p_status "LeaveStatus",
    p_rejection_reason TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_teacher_id UUID;
    v_days_requested INTEGER;
BEGIN
    SELECT "teacher_id", "days_requested" INTO v_teacher_id, v_days_requested
    FROM "LeaveRequest" WHERE "id" = p_leave_id;

    UPDATE "LeaveRequest" 
    SET "status" = p_status, 
        "approved_by" = p_approved_by, 
        "approved_at" = CURRENT_TIMESTAMP,
        "rejection_reason" = p_rejection_reason
    WHERE "id" = p_leave_id;

    IF p_status = 'APPROVED' THEN
        UPDATE "Teacher" 
        SET "leave_balance" = "leave_balance" - v_days_requested
        WHERE "user_id" = v_teacher_id;
    END IF;
END;
$$;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ END OF SCHEMA                                                                │
-- ═══════════════════════════════════════════════════════════════════════════════
