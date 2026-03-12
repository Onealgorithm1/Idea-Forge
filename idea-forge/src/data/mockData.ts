import { Bell, Home, FileEdit, type LucideIcon } from "lucide-react";
import { StarIcon } from "@/components/icons/StarIcon";
import { RocketIcon } from "@/components/icons/RocketIcon";

export interface Idea {
  id: string;
  title: string;
  description: string;
  author: string;
  department: string;
  votes: number;
  userVote: "up" | "down" | null;
  status: "Pending" | "Under Review" | "In Development" | "Shipped";
  tags: string[];
  createdAt: string;
}

export interface DeveloperBrief {
  id: string;
  ideaId: string;
  title: string;
  summary: string;
  acceptanceCriteria: string[];
  originalAuthor: string;
  originalDepartment: string;
  assignedDevs: { name: string; initials: string }[];
  votes: number;
  stage: "Backlog" | "In Progress" | "QA" | "Done";
}

/** Idea submission categories shown in the form dropdown. */
export const CATEGORIES = [
  "Sales / Opportunities",
  "Product Development",
  "UI/UX Design",
  "Marketing & Content",
  "Engineering & Tech",
  "Operations",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** An Idea augmented with a display icon and accent color for UI lists. */
export interface SimilarIdea extends Idea {
  icon: LucideIcon;
  iconColor: string;
}

const IDEA_ICONS = [StarIcon as unknown as LucideIcon, RocketIcon as unknown as LucideIcon, Bell, Home, FileEdit];
const IDEA_ICON_COLORS = ["bg-blue-500", "bg-sky-400", "bg-orange-400", "bg-purple-500", "bg-blue-600"];

/** Returns the top `count` mock ideas augmented with a display icon and color. */
export function getSimilarIdeas(count: number): SimilarIdea[] {
  return mockIdeas.slice(0, count).map((idea, index) => ({
    ...idea,
    icon: IDEA_ICONS[index % IDEA_ICONS.length],
    iconColor: IDEA_ICON_COLORS[index % IDEA_ICON_COLORS.length],
  }));
}

export const mockIdeas: Idea[] = [
  {
    id: "1",
    title: "One-Click Environment Provisioning",
    description: "Allow developers to spin up full staging environments with a single click from the dashboard. This would drastically reduce onboarding time for new engineers and speed up feature branch testing across teams.",
    author: "Sarah Chen",
    department: "Engineering",
    votes: 87,
    userVote: null,
    status: "In Development",
    tags: ["DevOps", "Backend"],
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    title: "Customer Health Score Dashboard",
    description: "Build a unified view that combines NPS, support ticket volume, product usage, and billing data into a single health score per customer. CSMs can prioritize outreach and reduce churn proactively.",
    author: "Marcus Johnson",
    department: "Customer Success",
    votes: 64,
    userVote: "up",
    status: "Under Review",
    tags: ["Analytics", "UI/UX"],
    createdAt: "2026-02-20",
  },
  {
    id: "3",
    title: "AI-Powered Meeting Summaries",
    description: "Integrate an AI summarizer into our video conferencing tool that generates action items, key decisions, and attendee contributions automatically after each meeting ends.",
    author: "Priya Patel",
    department: "Product",
    votes: 112,
    userVote: null,
    status: "In Development",
    tags: ["AI/ML", "Process"],
    createdAt: "2026-01-28",
  },
  {
    id: "4",
    title: "Unified Design Token System",
    description: "Implement a shared design token repository that syncs Figma variables to code automatically. This eliminates design-dev handoff friction and ensures pixel-perfect consistency.",
    author: "Alex Rivera",
    department: "Design",
    votes: 41,
    userVote: null,
    status: "Pending",
    tags: ["UI/UX", "Frontend"],
    createdAt: "2026-03-01",
  },
  {
    id: "5",
    title: "Smart Invoice Reconciliation",
    description: "Use ML to automatically match incoming invoices with purchase orders and flag discrepancies. Finance team currently spends 15+ hours/week on manual matching that could be automated.",
    author: "Diana Okafor",
    department: "Finance",
    votes: 53,
    userVote: null,
    status: "Under Review",
    tags: ["AI/ML", "Process"],
    createdAt: "2026-02-10",
  },
  {
    id: "6",
    title: "Dark Mode for Internal Tools",
    description: "Add a system-wide dark mode toggle to all internal tools. Multiple teams have requested this for late-night on-call work and accessibility reasons.",
    author: "Jake Thompson",
    department: "Engineering",
    votes: 38,
    userVote: "up",
    status: "Pending",
    tags: ["UI/UX", "Frontend"],
    createdAt: "2026-03-05",
  },
  {
    id: "7",
    title: "Automated Compliance Reporting",
    description: "Build a pipeline that continuously monitors our infrastructure for SOC2 and GDPR compliance, generating audit-ready reports monthly without manual data gathering.",
    author: "Lena Müller",
    department: "Legal",
    votes: 29,
    userVote: null,
    status: "Pending",
    tags: ["Backend", "Process"],
    createdAt: "2026-03-03",
  },
  {
    id: "8",
    title: "Cross-Team Resource Booking",
    description: "A shared calendar system for booking meeting rooms, lab equipment, and shared hardware across offices. Currently each floor uses a different spreadsheet.",
    author: "Tom Nakamura",
    department: "Operations",
    votes: 17,
    userVote: null,
    status: "Pending",
    tags: ["Process", "UI/UX"],
    createdAt: "2026-03-06",
  },
];

export const mockBriefs: DeveloperBrief[] = [
  {
    id: "b1",
    ideaId: "3",
    title: "AI Meeting Summarizer Integration",
    summary: "Integrate a fine-tuned LLM pipeline into the existing video conferencing service. The system should process meeting transcripts in near real-time, extract action items, key decisions, and generate structured summaries stored in the team wiki.",
    acceptanceCriteria: [
      "Summaries generated within 5 minutes of meeting end",
      "Action items auto-assigned to mentioned participants",
      "Supports meetings up to 2 hours in length",
      "95%+ accuracy on action item extraction in testing",
      "Integrates with existing wiki API for auto-posting",
    ],
    originalAuthor: "Priya Patel",
    originalDepartment: "Product",
    assignedDevs: [
      { name: "Kevin Wu", initials: "KW" },
      { name: "Maria Santos", initials: "MS" },
    ],
    votes: 112,
    stage: "In Progress",
  },
  {
    id: "b2",
    ideaId: "1",
    title: "One-Click Staging Environments",
    summary: "Extend the existing IaC templates to support parameterized environment creation via a dashboard button. Should provision compute, database, and service mesh in under 10 minutes with auto-teardown after 72 hours of inactivity.",
    acceptanceCriteria: [
      "Environment ready in <10 minutes from click",
      "Auto-teardown after 72h inactivity",
      "Supports latest 3 service versions",
      "Cost tracking per environment visible in dashboard",
      "Slack notification on provision/teardown events",
    ],
    originalAuthor: "Sarah Chen",
    originalDepartment: "Engineering",
    assignedDevs: [
      { name: "Jordan Blake", initials: "JB" },
      { name: "Aisha Rahman", initials: "AR" },
      { name: "Chris Lee", initials: "CL" },
    ],
    votes: 87,
    stage: "In Progress",
  },
  {
    id: "b3",
    ideaId: "2",
    title: "Customer Health Score Engine",
    summary: "Build a composite scoring engine that ingests NPS survey results, Zendesk ticket metadata, product analytics events, and Stripe billing data. Expose via REST API and a dedicated CSM dashboard widget with trend visualization.",
    acceptanceCriteria: [
      "Score updates daily by 6 AM UTC",
      "Configurable weight per signal source",
      "Dashboard shows 90-day trend line per customer",
      "Alert triggers when score drops below threshold",
      "API endpoint documented in OpenAPI spec",
    ],
    originalAuthor: "Marcus Johnson",
    originalDepartment: "Customer Success",
    assignedDevs: [
      { name: "Nina Volkov", initials: "NV" },
    ],
    votes: 64,
    stage: "Backlog",
  },
  {
    id: "b4",
    ideaId: "5",
    title: "ML Invoice Matcher",
    summary: "Train a classification model on historical PO-invoice pairs to auto-match new invoices. Flag confidence scores below 85% for manual review. Integrate with existing ERP system via webhook.",
    acceptanceCriteria: [
      "Match accuracy >90% on test dataset",
      "Process batch of 500 invoices in <5 minutes",
      "Low-confidence matches queued for human review",
      "Audit trail for all automated matches",
      "Weekly accuracy report emailed to Finance lead",
    ],
    originalAuthor: "Diana Okafor",
    originalDepartment: "Finance",
    assignedDevs: [
      { name: "Sam Torres", initials: "ST" },
      { name: "Kevin Wu", initials: "KW" },
    ],
    votes: 53,
    stage: "Backlog",
  },
];
