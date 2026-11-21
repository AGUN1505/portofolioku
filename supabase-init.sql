-- ============================================================
-- SUPABASE COMPLETE DATABASE INITIALIZATION SCRIPT FOR PORTO
-- Run this script in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. SCHEMAS & TABLES
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "hero_profiles" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hero_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "engineering_nodes" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stack" TEXT,
    "highlighted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "engineering_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "about_profiles" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heading" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "primaryNarrative" TEXT NOT NULL,
    "secondaryNarrative" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "about_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "domains" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pillars" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pillars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technologies" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "projectUrl" TEXT,
    "githubUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "experiences" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "track" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "skill_categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_profiles" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heading" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_channels" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "certificates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "fileUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "section_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "section_configs_pkey" PRIMARY KEY ("id")
);

-- 2. INDEXES & FOREIGN KEYS
CREATE UNIQUE INDEX IF NOT EXISTS "admins_username_key" ON "admins"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_key" ON "admins"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "section_configs_key_key" ON "section_configs"("key");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'skills_categoryId_fkey'
    ) THEN
        ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" 
        FOREIGN KEY ("categoryId") REFERENCES "skill_categories"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. INITIAL SEED DATA
-- 3.1 Hero Profile
INSERT INTO "hero_profiles" ("id", "name", "tagline", "bio", "country", "code", "timezone", "discipline", "createdAt", "updatedAt")
VALUES (
    'singleton',
    'Agun Firmansyah',
    E'Building systems.\nSolving problems.',
    'I''m Agun Firmansyah, a software developer focused on backend engineering, building practical digital solutions, and sharing knowledge through programming education.',
    'Indonesia',
    'ID',
    'GMT+7',
    'BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY',
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "tagline" = EXCLUDED."tagline",
    "bio" = EXCLUDED."bio",
    "discipline" = EXCLUDED."discipline",
    "updatedAt" = NOW();

-- 3.2 Roles
INSERT INTO "roles" ("id", "title", "primary", "order", "createdAt", "updatedAt")
VALUES
    ('role_01', 'Software Developer', true, 1, NOW(), NOW()),
    ('role_02', 'Backend Engineer', true, 2, NOW(), NOW()),
    ('role_03', 'Informatics Engineering Student', false, 3, NOW(), NOW()),
    ('role_04', 'Programming Instructor', false, 4, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.3 Engineering Nodes
INSERT INTO "engineering_nodes" ("id", "tag", "title", "description", "stack", "highlighted", "order", "createdAt", "updatedAt")
VALUES
    ('enode_01', '01 / DECONSTRUCT', 'Understand How Systems Work', 'Analyze domain requirements, data relationships, and core problem constraints.', NULL, false, 1, NOW(), NOW()),
    ('enode_02', '02 / ARCHITECT & BUILD', 'Backend & Practical Solutions', 'Design clean REST APIs, relational schemas, and reliable application logic.', 'GO • LARAVEL • EXPRESS • POSTGRESQL', true, 2, NOW(), NOW()),
    ('enode_03', '03 / SHARE & EDUCATE', 'Programming Instruction', 'Distill complex technical systems into clear, structured learning for students.', NULL, false, 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.4 About Profile
INSERT INTO "about_profiles" ("id", "heading", "quote", "primaryNarrative", "secondaryNarrative", "createdAt", "updatedAt")
VALUES (
    'singleton',
    'About & Philosophy',
    '"To build reliable software or teach it effectively, you have to care about how the underlying system actually works."',
    'Building reliable software, teaching it effectively.',
    'Systems engineering and education.',
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- 3.5 Domains
INSERT INTO "domains" ("id", "index", "title", "order", "createdAt", "updatedAt")
VALUES
    ('domain_01', '01', 'Software Engineering', 1, NOW(), NOW()),
    ('domain_02', '02', 'Backend Development', 2, NOW(), NOW()),
    ('domain_03', '03', 'Problem Solving', 3, NOW(), NOW()),
    ('domain_04', '04', 'Educational Technology', 4, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.6 Pillars
INSERT INTO "pillars" ("id", "index", "title", "description", "order", "createdAt", "updatedAt")
VALUES
    ('pillar_01', '01', 'Backend Systems', 'Building structured REST APIs, relational data models, and dependable server-side logic with Go, Laravel, and Node.js.', 1, NOW(), NOW()),
    ('pillar_02', '02', 'Practical Solutions', 'Translating real-world operational needs into clean, functional web and mobile applications without unnecessary bloat.', 2, NOW(), NOW()),
    ('pillar_03', '03', 'Knowledge Sharing', 'Guiding students to grasp computational logic, structured programming, and engineering fundamentals through teaching.', 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.7 Projects
INSERT INTO "projects" ("id", "title", "category", "description", "technologies", "published", "publishedAt", "order", "createdAt", "updatedAt")
VALUES
    ('project_01', 'Water Reminder App', 'Mobile & REST API System', 'Aplikasi pengingat konsumsi air harian yang terintegrasi dengan layanan REST API untuk pencatatan dan pemantauan hidrasi secara terstruktur.', '["Flutter", "Laravel", "REST API"]'::jsonb, true, NOW(), 1, NOW(), NOW()),
    ('project_02', 'Urkins', 'Android Mobile Application', 'Aplikasi self-care untuk kesehatan kulit berbasis Android yang dirancang untuk mendukung pemantauan dan rutinitas perawatan kulit pengguna.', '["Android Application"]'::jsonb, true, NOW(), 2, NOW(), NOW()),
    ('project_03', 'Pesantren Management System', 'Information System & Generative AI', 'Sistem informasi manajemen pesantren berbasis web dengan integrasi Generative AI untuk mendukung layanan informasi secara terpusat.', '["React", "Express.js", "PostgreSQL", "Generative AI"]'::jsonb, true, NOW(), 3, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.8 Experiences
INSERT INTO "experiences" ("id", "role", "institution", "track", "order", "createdAt", "updatedAt")
VALUES
    ('exp_01', 'Programming Teacher', 'Timedoor Academy', 'EDUCATION', 1, NOW(), NOW()),
    ('exp_02', 'Programming Instructor', 'SMK Negeri 2 Kota Jambi', 'EDUCATION', 2, NOW(), NOW()),
    ('exp_03', 'Data Entry Specialist', 'PT Angkasa Pura 2', 'DATA & OPS', 3, NOW(), NOW()),
    ('exp_04', 'IT Solution Technician', 'Technical Systems & Support', 'IT SYSTEMS', 4, NOW(), NOW()),
    ('exp_05', 'Freelance Web Developer', 'Independent Web Engineering', 'ENGINEERING', 5, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.9 Skill Categories & Skills
INSERT INTO "skill_categories" ("id", "title", "order", "createdAt", "updatedAt")
VALUES
    ('skill_cat_01', 'Backend Engineering', 1, NOW(), NOW()),
    ('skill_cat_02', 'Frontend & Mobile', 2, NOW(), NOW()),
    ('skill_cat_03', 'Relational Data', 3, NOW(), NOW()),
    ('skill_cat_04', 'DevOps & Tooling', 4, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "skills" ("id", "name", "categoryId", "order", "createdAt", "updatedAt")
VALUES
    ('skill_01', 'Go', 'skill_cat_01', 1, NOW(), NOW()),
    ('skill_02', 'Laravel', 'skill_cat_01', 2, NOW(), NOW()),
    ('skill_03', 'Express.js', 'skill_cat_01', 3, NOW(), NOW()),
    ('skill_04', 'Node.js', 'skill_cat_01', 4, NOW(), NOW()),
    ('skill_05', 'React', 'skill_cat_02', 1, NOW(), NOW()),
    ('skill_06', 'Flutter', 'skill_cat_02', 2, NOW(), NOW()),
    ('skill_07', 'PostgreSQL', 'skill_cat_03', 1, NOW(), NOW()),
    ('skill_08', 'Git', 'skill_cat_04', 1, NOW(), NOW()),
    ('skill_09', 'GitHub', 'skill_cat_04', 2, NOW(), NOW()),
    ('skill_10', 'Postman', 'skill_cat_04', 3, NOW(), NOW()),
    ('skill_11', 'Docker', 'skill_cat_04', 4, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3.10 Contact Profile
INSERT INTO "contact_profiles" ("id", "heading", "ctaLabel", "description", "createdAt", "updatedAt")
VALUES (
    'singleton',
    'Let''s build something together.',
    'Get in Touch',
    'Open to project collaboration, technical consultation, or programming education opportunities. Reach out through any channel below.',
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- 3.11 Section Configs (Dynamic CMS Ordering)
INSERT INTO "section_configs" ("id", "key", "label", "order", "enabled", "createdAt", "updatedAt")
VALUES
    ('sec_01', 'hero', 'Hero Section', 0, true, NOW(), NOW()),
    ('sec_02', 'about', 'About Section', 1, true, NOW(), NOW()),
    ('sec_03', 'projects', 'Projects Section', 2, true, NOW(), NOW()),
    ('sec_04', 'experience', 'Experience Section', 3, true, NOW(), NOW()),
    ('sec_05', 'skills', 'Skills Section', 4, true, NOW(), NOW()),
    ('sec_06', 'certificates', 'Certificates Section', 5, true, NOW(), NOW()),
    ('sec_07', 'contact', 'Contact Section', 6, true, NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;

-- 3.12 Administrator Account
INSERT INTO "admins" ("id", "username", "passwordHash", "email", "sessionVersion", "createdAt", "updatedAt")
VALUES (
    'admin_root',
    'admin',
    '$2b$12$0YQzmDlKOo7RjeuF/xIJcO7D.eyAWJWYf/SPun/kuos8/EZgWCHvq',
    'agun1505@gmail.com',
    1,
    NOW(),
    NOW()
)
ON CONFLICT ("username") DO NOTHING;

