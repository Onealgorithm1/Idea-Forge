/** Typed route constants — use instead of raw string literals throughout the app. */
export const ROUTES = {
  ROOT: "/",
  IDEA_BOARD: "/idea-board",
  ROADMAP: "/roadmap",
  ANALYTICS: "/analytics",
  SUBMIT_IDEA: "/submit-idea",
  LOGIN: "/login",
  SIGNUP: "/signup",
  IDEA_DETAIL: "/ideas/:id",
  PROFILE: "/profile",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
} as const;
