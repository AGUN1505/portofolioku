import type { IPortfolioRepository } from "../../domain/repositories/portfolio.repository";
import type { Portfolio } from "../../domain/entities";

export class StaticPortfolioRepository implements IPortfolioRepository {
  getPortfolioData(): Portfolio {
    return {
      hero: {
        name: "Agun Firmansyah",
        tagline: "Building systems.\nSolving problems.",
        bio: "I'm Agun Firmansyah, a software developer focused on backend engineering, building practical digital solutions, and sharing knowledge through programming education.",
        roles: [
          { title: "Software Developer", primary: true },
          { title: "Backend Engineer", primary: true },
          { title: "Informatics Engineering Student", primary: false },
          { title: "Programming Instructor", primary: false },
        ],
        location: {
          country: "Indonesia",
          code: "ID",
          timezone: "GMT+7",
        },
        engineeringNodes: [
          {
            tag: "01 / DECONSTRUCT",
            title: "Understand How Systems Work",
            description:
              "Analyze domain requirements, data relationships, and core problem constraints.",
            highlighted: false,
          },
          {
            tag: "02 / ARCHITECT & BUILD",
            title: "Backend & Practical Solutions",
            description:
              "Design clean REST APIs, relational schemas, and reliable application logic.",
            stack: "GO • LARAVEL • EXPRESS • POSTGRESQL",
            highlighted: true,
          },
          {
            tag: "03 / SHARE & EDUCATE",
            title: "Programming Instruction",
            description:
              "Distill complex technical systems into clear, structured learning for students.",
            highlighted: false,
          },
        ],
        discipline: "BACKEND ARCHITECTURE • SYSTEMS • PEDAGOGY",
      },
      about: {
        heading: "About & Philosophy",
        quote:
          '"To build reliable software or teach it effectively, you have to care about how the underlying system actually works."',
        narratives: {
          primary: "Building reliable software, teaching it effectively.",
          secondary: "Systems engineering and education.",
        },
        domains: [
          { index: "01", title: "Software Engineering" },
          { index: "02", title: "Backend Development" },
          { index: "03", title: "Problem Solving" },
          { index: "04", title: "Educational Technology" },
        ],
        pillars: [
          {
            index: "01",
            title: "Backend Systems",
            description:
              "Building structured REST APIs, relational data models, and dependable server-side logic with Go, Laravel, and Node.js.",
          },
          {
            index: "02",
            title: "Practical Solutions",
            description:
              "Translating real-world operational needs into clean, functional web and mobile applications without unnecessary bloat.",
          },
          {
            index: "03",
            title: "Knowledge Sharing",
            description:
              "Guiding students to grasp computational logic, structured programming, and engineering fundamentals through teaching.",
          },
        ],
      },
      projects: [
        {
          id: "01",
          title: "Water Reminder App",
          category: "Mobile & REST API System",
          description:
            "Aplikasi pengingat konsumsi air harian yang terintegrasi dengan layanan REST API untuk pencatatan dan pemantauan hidrasi secara terstruktur.",
          technologies: ["Flutter", "Laravel", "REST API"],
        },
        {
          id: "02",
          title: "Urkins",
          category: "Android Mobile Application",
          description:
            "Aplikasi self-care untuk kesehatan kulit berbasis Android yang dirancang untuk mendukung pemantauan dan rutinitas perawatan kulit pengguna.",
          technologies: ["Android Application"],
        },
        {
          id: "03",
          title: "Pesantren Management System",
          category: "Information System & Generative AI",
          description:
            "Sistem informasi manajemen pesantren berbasis web dengan integrasi Generative AI untuk mendukung layanan informasi secara terpusat.",
          technologies: ["React", "Express.js", "PostgreSQL", "Generative AI"],
        },
      ],
      experiences: [
        {
          id: "01",
          role: "Programming Teacher",
          institution: "Timedoor Academy",
          track: "EDUCATION",
        },
        {
          id: "02",
          role: "Programming Instructor",
          institution: "SMK Negeri 2 Kota Jambi",
          track: "EDUCATION",
        },
        {
          id: "03",
          role: "Data Entry Specialist",
          institution: "PT Angkasa Pura 2",
          track: "DATA & OPS",
        },
        {
          id: "04",
          role: "IT Solution Technician",
          institution: "Technical Systems & Support",
          track: "IT SYSTEMS",
        },
        {
          id: "05",
          role: "Freelance Web Developer",
          institution: "Independent Web Engineering",
          track: "ENGINEERING",
        },
      ],
      skills: {
        categories: [
          {
            title: "Backend Engineering",
            skills: ["Go", "Laravel", "Express.js", "Node.js"],
          },
          {
            title: "Frontend & Mobile",
            skills: ["React", "Flutter"],
          },
          {
            title: "Relational Data",
            skills: ["PostgreSQL"],
          },
          {
            title: "DevOps & Tooling",
            skills: ["Git", "GitHub", "Postman", "Docker"],
          },
        ],
      },
      contact: {
        heading: "Let's build something together.",
        ctaLabel: "Get in Touch",
        description:
          "Open to project collaboration, technical consultation, or programming education opportunities. Reach out through any channel below.",
        channels: [
          {
            label: "EMAIL",
            value: "[ Email Placeholder — Ready for Official Address ]",
          },
          {
            label: "GITHUB",
            value: "GitHub — [ Profile URL Placeholder ]",
          },
          {
            label: "LINKEDIN",
            value: "LinkedIn — [ Profile URL Placeholder ]",
          },
        ],
      },
      certificates: [
        {
          id: "cert_01",
          title: "Backend Development with Go",
          issuer: "Coursera / Meta",
          issueDate: new Date("2023-08-15"),
          credentialId: "META-GO-2023-001",
          credentialUrl: "https://coursera.org/verify/sample-go",
          fileUrl: "/uploads/certificates/sample-go-cert.pdf",
          order: 1,
          createdAt: new Date("2023-08-15T00:00:00.000Z"),
          updatedAt: new Date("2023-08-15T00:00:00.000Z"),
        },
        {
          id: "cert_02",
          title: "Building RESTful APIs with Laravel & PHP",
          issuer: "Dicoding Indonesia",
          issueDate: new Date("2023-11-20"),
          credentialId: "DCD-LARAVEL-2023-442",
          credentialUrl: "https://dicoding.com/certificates/sample-laravel",
          fileUrl: "/uploads/certificates/sample-laravel-cert.pdf",
          order: 2,
          createdAt: new Date("2023-11-20T00:00:00.000Z"),
          updatedAt: new Date("2023-11-20T00:00:00.000Z"),
        },
        {
          id: "cert_03",
          title: "PostgreSQL Database Administration & SQL Mastery",
          issuer: "Udemy",
          issueDate: new Date("2024-02-10"),
          credentialId: "UC-POSTGRES-2024-991",
          credentialUrl: "https://udemy.com/certificate/sample-postgres",
          fileUrl: "/uploads/certificates/sample-postgres-cert.pdf",
          order: 3,
          createdAt: new Date("2024-02-10T00:00:00.000Z"),
          updatedAt: new Date("2024-02-10T00:00:00.000Z"),
        },
      ],
      sections: [
        {
          id: "sec_hero",
          key: "hero",
          label: "Hero",
          order: 1,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_about",
          key: "about",
          label: "About",
          order: 2,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_projects",
          key: "projects",
          label: "Projects",
          order: 3,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_experience",
          key: "experience",
          label: "Experience",
          order: 4,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_skills",
          key: "skills",
          label: "Skills",
          order: 5,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_certificates",
          key: "certificates",
          label: "Certificates",
          order: 6,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          id: "sec_contact",
          key: "contact",
          label: "Contact",
          order: 7,
          enabled: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
    };
  }
}
