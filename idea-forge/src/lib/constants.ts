/** Typed route constants — use instead of raw string literals throughout the app. */
export const ROUTES = {
  // Non-tenant routes
  SUPER_ADMIN: "/super-admin",
  
  // Tenant-scoped routes (relative)
  ROOT: "/",
  DASHBOARD: "/dashboard",
  IDEA_BOARD: "/idea-board",
  ROADMAP: "/roadmap",
  ANALYTICS: "/analytics",
  MY_IDEAS: "/my-ideas",
  SAVED_IDEAS: "/saved-ideas",
  SUBMIT_IDEA: "/submit-idea",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  IDEA_DETAIL: "/ideas/:id",
  PROFILE: "/profile",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_CATEGORIES: "/admin/categories",
} as const;

export const getTenantPath = (path: string, slug?: string) => {
  if (!slug) return path;
  // Ensure path starts with / but strip it for concatenation
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const cleanSlug = slug.startsWith('/') ? slug.substring(1) : slug;
  return `/${cleanSlug}/${cleanPath}`;
};

export const PLATFORM_STATUS_LABELS: Record<string, string> = {
  "Pending": "Ideation",
  "Under Review": "Ideation",
  "In Progress": "In Development",
  "In Development": "In Development",
  "QA": "QA & Testing",
  "Shipped": "In Production",
};
