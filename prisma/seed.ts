import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- SEEDING DATABASE: porto_cms ---');

  // 1. HeroProfile (Singleton)
  await prisma.heroProfile.upsert({
    where: { id: 'singleton' },
    update: {
      name: 'Agun Firmansyah',
      tagline: 'Building systems.\nSolving problems.',
      bio: "I'm Agun Firmansyah, a software developer focused on backend engineering, building practical digital solutions, and sharing knowledge through programming education.",
      country: 'Indonesia',
      code: 'ID',
      timezone: 'GMT+7',
      discipline: 'BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY',
    },
    create: {
      id: 'singleton',
      name: 'Agun Firmansyah',
      tagline: 'Building systems.\nSolving problems.',
      bio: "I'm Agun Firmansyah, a software developer focused on backend engineering, building practical digital solutions, and sharing knowledge through programming education.",
      country: 'Indonesia',
      code: 'ID',
      timezone: 'GMT+7',
      discipline: 'BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY',
    },
  });

  // 2. Roles
  const roles = [
    { id: 'role_01', title: 'Software Developer', primary: true, order: 1 },
    { id: 'role_02', title: 'Backend Engineer', primary: true, order: 2 },
    { id: 'role_03', title: 'Informatics Engineering Student', primary: false, order: 3 },
    { id: 'role_04', title: 'Programming Instructor', primary: false, order: 4 },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { title: role.title, primary: role.primary, order: role.order },
      create: role,
    });
  }

  // 3. Engineering Nodes
  const engineeringNodes = [
    {
      id: 'enode_01',
      tag: '01 / DECONSTRUCT',
      title: 'Understand How Systems Work',
      description: 'Analyze domain requirements, data relationships, and core problem constraints.',
      stack: null,
      highlighted: false,
      order: 1,
    },
    {
      id: 'enode_02',
      tag: '02 / ARCHITECT & BUILD',
      title: 'Backend & Practical Solutions',
      description: 'Design clean REST APIs, relational schemas, and reliable application logic.',
      stack: 'GO • LARAVEL • EXPRESS • POSTGRESQL',
      highlighted: true,
      order: 2,
    },
    {
      id: 'enode_03',
      tag: '03 / SHARE & EDUCATE',
      title: 'Programming Instruction',
      description: 'Distill complex technical systems into clear, structured learning for students.',
      stack: null,
      highlighted: false,
      order: 3,
    },
  ];
  for (const node of engineeringNodes) {
    await prisma.engineeringNode.upsert({
      where: { id: node.id },
      update: {
        tag: node.tag,
        title: node.title,
        description: node.description,
        stack: node.stack,
        highlighted: node.highlighted,
        order: node.order,
      },
      create: node,
    });
  }

  // 4. AboutProfile (Singleton)
  await prisma.aboutProfile.upsert({
    where: { id: 'singleton' },
    update: {
      heading: 'About & Philosophy',
      quote: '"To build reliable software or teach it effectively, you have to care about how the underlying system actually works."',
      primaryNarrative: 'Building reliable software, teaching it effectively.',
      secondaryNarrative: 'Systems engineering and education.',
    },
    create: {
      id: 'singleton',
      heading: 'About & Philosophy',
      quote: '"To build reliable software or teach it effectively, you have to care about how the underlying system actually works."',
      primaryNarrative: 'Building reliable software, teaching it effectively.',
      secondaryNarrative: 'Systems engineering and education.',
    },
  });

  // 5. Domains
  const domains = [
    { id: 'domain_01', index: '01', title: 'Software Engineering', order: 1 },
    { id: 'domain_02', index: '02', title: 'Backend Development', order: 2 },
    { id: 'domain_03', index: '03', title: 'Problem Solving', order: 3 },
    { id: 'domain_04', index: '04', title: 'Educational Technology', order: 4 },
  ];
  for (const domain of domains) {
    await prisma.domain.upsert({
      where: { id: domain.id },
      update: { index: domain.index, title: domain.title, order: domain.order },
      create: domain,
    });
  }

  // 6. Pillars
  const pillars = [
    {
      id: 'pillar_01',
      index: '01',
      title: 'Backend Systems',
      description: 'Building structured REST APIs, relational data models, and dependable server-side logic with Go, Laravel, and Node.js.',
      order: 1,
    },
    {
      id: 'pillar_02',
      index: '02',
      title: 'Practical Solutions',
      description: 'Translating real-world operational needs into clean, functional web and mobile applications without unnecessary bloat.',
      order: 2,
    },
    {
      id: 'pillar_03',
      index: '03',
      title: 'Knowledge Sharing',
      description: 'Guiding students to grasp computational logic, structured programming, and engineering fundamentals through teaching.',
      order: 3,
    },
  ];
  for (const pillar of pillars) {
    await prisma.pillar.upsert({
      where: { id: pillar.id },
      update: { index: pillar.index, title: pillar.title, description: pillar.description, order: pillar.order },
      create: pillar,
    });
  }

  // 7. Projects
  const projects = [
    {
      id: 'project_01',
      title: 'Water Reminder App',
      category: 'Mobile & REST API System',
      description: 'Aplikasi pengingat konsumsi air harian yang terintegrasi dengan layanan REST API untuk pencatatan dan pemantauan hidrasi secara terstruktur.',
      technologies: ['Flutter', 'Laravel', 'REST API'],
      published: true,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      order: 1,
    },
    {
      id: 'project_02',
      title: 'Urkins',
      category: 'Android Mobile Application',
      description: 'Aplikasi self-care untuk kesehatan kulit berbasis Android yang dirancang untuk mendukung pemantauan dan rutinitas perawatan kulit pengguna.',
      technologies: ['Android Application'],
      published: true,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      order: 2,
    },
    {
      id: 'project_03',
      title: 'Pesantren Management System',
      category: 'Information System & Generative AI',
      description: 'Sistem informasi manajemen pesantren berbasis web dengan integrasi Generative AI untuk mendukung layanan informasi secara terpusat.',
      technologies: ['React', 'Express.js', 'PostgreSQL', 'Generative AI'],
      published: true,
      publishedAt: new Date('2026-01-01T00:00:00Z'),
      order: 3,
    },
  ];
  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        title: project.title,
        category: project.category,
        description: project.description,
        technologies: project.technologies,
        published: project.published,
        publishedAt: project.publishedAt,
        order: project.order,
      },
      create: project,
    });
  }

  // 8. Experiences
  const experiences = [
    {
      id: 'exp_01',
      role: 'Programming Teacher',
      institution: 'Timedoor Academy',
      track: 'EDUCATION',
      order: 1,
    },
    {
      id: 'exp_02',
      role: 'Programming Instructor',
      institution: 'SMK Negeri 2 Kota Jambi',
      track: 'EDUCATION',
      order: 2,
    },
    {
      id: 'exp_03',
      role: 'Data Entry Specialist',
      institution: 'PT Angkasa Pura 2',
      track: 'DATA & OPS',
      order: 3,
    },
    {
      id: 'exp_04',
      role: 'IT Solution Technician',
      institution: 'Technical Systems & Support',
      track: 'IT SYSTEMS',
      order: 4,
    },
    {
      id: 'exp_05',
      role: 'Freelance Web Developer',
      institution: 'Independent Web Engineering',
      track: 'ENGINEERING',
      order: 5,
    },
  ];
  for (const exp of experiences) {
    await prisma.experience.upsert({
      where: { id: exp.id },
      update: {
        role: exp.role,
        institution: exp.institution,
        track: exp.track,
        order: exp.order,
      },
      create: exp,
    });
  }

  // 9. Skill Categories & Skills
  const skillCategories = [
    {
      id: 'skill_cat_01',
      title: 'Backend Engineering',
      order: 1,
      skills: [
        { id: 'skill_01', name: 'Go', order: 1 },
        { id: 'skill_02', name: 'Laravel', order: 2 },
        { id: 'skill_03', name: 'Express.js', order: 3 },
        { id: 'skill_04', name: 'Node.js', order: 4 },
      ],
    },
    {
      id: 'skill_cat_02',
      title: 'Frontend & Mobile',
      order: 2,
      skills: [
        { id: 'skill_05', name: 'React', order: 1 },
        { id: 'skill_06', name: 'Flutter', order: 2 },
      ],
    },
    {
      id: 'skill_cat_03',
      title: 'Relational Data',
      order: 3,
      skills: [
        { id: 'skill_07', name: 'PostgreSQL', order: 1 },
      ],
    },
    {
      id: 'skill_cat_04',
      title: 'DevOps & Tooling',
      order: 4,
      skills: [
        { id: 'skill_08', name: 'Git', order: 1 },
        { id: 'skill_09', name: 'GitHub', order: 2 },
        { id: 'skill_10', name: 'Postman', order: 3 },
        { id: 'skill_11', name: 'Docker', order: 4 },
      ],
    },
  ];
  for (const cat of skillCategories) {
    await prisma.skillCategory.upsert({
      where: { id: cat.id },
      update: { title: cat.title, order: cat.order },
      create: { id: cat.id, title: cat.title, order: cat.order },
    });

    for (const skill of cat.skills) {
      await prisma.skill.upsert({
        where: { id: skill.id },
        update: { name: skill.name, categoryId: cat.id, order: skill.order },
        create: { id: skill.id, name: skill.name, categoryId: cat.id, order: skill.order },
      });
    }
  }

  // 10. ContactProfile (Singleton)
  await prisma.contactProfile.upsert({
    where: { id: 'singleton' },
    update: {
      heading: "Let's build something together.",
      ctaLabel: 'Get in Touch',
      description: 'Open to project collaboration, technical consultation, or programming education opportunities. Reach out through any channel below.',
    },
    create: {
      id: 'singleton',
      heading: "Let's build something together.",
      ctaLabel: 'Get in Touch',
      description: 'Open to project collaboration, technical consultation, or programming education opportunities. Reach out through any channel below.',
    },
  });

  // Note: Admins table intentionally not seeded (no admin creation in Phase 3.5).
  // Note: ContactChannels intentionally not seeded (withheld placeholder values).

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed execution error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
