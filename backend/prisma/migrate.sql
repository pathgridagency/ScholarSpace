CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
CREATE TYPE "ListingType" AS ENUM ('TEXTBOOK', 'NOTES', 'STUDY_GUIDE');
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'PENDING', 'SOLD');

CREATE TABLE "University" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE
);

CREATE TABLE "User" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "universityId" UUID NOT NULL REFERENCES "University"(id),
    major TEXT,
    "gradYear" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_university ON "User"("universityId");

CREATE TABLE "Project" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" UUID NOT NULL REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_creator ON "Project"("createdById");

CREATE TABLE "ProjectMember" (
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    role "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("userId", "projectId")
);

CREATE INDEX idx_projectmember_project ON "ProjectMember"("projectId");

CREATE TABLE "Task" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "projectId" UUID NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
    "assignedToId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_project_status ON "Task"("projectId", status);
CREATE INDEX idx_task_assignee ON "Task"("assignedToId");

CREATE TABLE "StudyRoom" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "hostId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_studyroom_host ON "StudyRoom"("hostId");

CREATE TABLE "MarketplaceListing" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "sellerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type "ListingType" NOT NULL,
    title TEXT NOT NULL,
    isbn TEXT,
    price DECIMAL(8, 2) NOT NULL,
    status "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_seller ON "MarketplaceListing"("sellerId");
CREATE INDEX idx_marketplace_status ON "MarketplaceListing"(status);
