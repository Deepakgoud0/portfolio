export const profile = {
  name: "Jagiryala Deepak Goud",
  shortName: "Deepak Goud",
  role: "Full-Stack Software Engineer",
  tagline:
    "I build systems that move data — APIs, caches, and the real-time plumbing you don't see.",
  location: "Hyderabad, India",
  email: "deepakgoud1979@gmail.com",
  github: "https://github.com/Deepakgoud0",
  linkedin: "https://linkedin.com/in/deepakgoudjagiryala0212",
};

export const about =
  "Full-stack engineer with 2+ years building and scaling a multi-tenant healthcare EMR platform. I work across the stack but I'm happiest in the backend — designing APIs, wiring up integrations, and making data move fast with caching and well-shaped queries.";

export const stats = [
  { value: "2+", label: "years shipping" },
  { value: "6+", label: "integrations built" },
  { value: "1", label: "custom EDI X12 parser" },
];

export const skills = [
  { group: "Languages", items: ["TypeScript", "JavaScript"] },
  { group: "Backend", items: ["Node.js", "Bun", "Elysia", "REST APIs", "WebSockets"] },
  { group: "Frontend", items: ["React", "Vite", "Tailwind CSS", "TanStack"] },
  { group: "Data", items: ["MongoDB", "Redis", "PostgreSQL"] },
  { group: "Cloud & DevOps", items: ["AWS (EC2/S3/SES/SNS)", "Docker", "Render", "Vercel"] },
  { group: "Auth & Tooling", items: ["JWT", "Auth0", "Git", "Postman"] },
];

export interface Project {
  name: string;
  tag?: string;
  year: string;
  blurb: string;
  stack: string[];
  live?: string;
  repo?: string;
  preview?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    name: "Snip",
    tag: "Featured",
    year: "2026",
    blurb:
      "A URL shortener with analytics — Redis-cached redirects, self-implemented JWT auth, and a click dashboard: clicks over time, top referrers, device breakdown, and a live cache-hit ratio.",
    stack: ["Bun", "Elysia", "MongoDB", "Redis", "React", "TypeScript"],
    live: "https://snip-pj53.vercel.app",
    repo: "https://github.com/Deepakgoud0/Snip",
    preview: "/snip.png",
    featured: true,
  },
  {
    name: "Live Weather App",
    year: "2024",
    blurb:
      "Real-time weather using the OpenWeatherMap API, with async data handling and a responsive UI.",
    stack: ["JavaScript", "REST API", "Bootstrap"],
    featured: false,
  },
  {
    name: "Task Management System",
    year: "2024",
    blurb: "A full CRUD task manager built on a clean, modular JavaScript architecture.",
    stack: ["JavaScript", "HTML", "CSS"],
    featured: false,
  },
];

export const experience = [
  {
    company: "iVectors Software Solutions LLP",
    role: "Software Engineer (Full Stack)",
    period: "Jun 2024 — Present",
    location: "Hyderabad, India",
    points: [
      "Built and maintained backend services for a multi-tenant SaaS healthcare platform (Node.js, TypeScript, Bun, MongoDB).",
      "Integrated 6+ third-party services across REST, SOAP, webhook, and SFTP; built a custom parser for a complex structured data-interchange format (EDI X12).",
      "Optimized MongoDB aggregation pipelines and added Redis caching to cut dashboard and query load times.",
      "Implemented auth (Auth0, AWS Cognito, JWT) and deployed services on AWS with PM2, plus scheduled cron jobs.",
    ],
  },
];
