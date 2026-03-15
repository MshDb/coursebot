export const APP_NAME = "CourseBot";
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;
export const DEFAULT_LOCALE = "en";

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in to access this resource",
  FORBIDDEN: "You do not have permission to access this resource",
  NOT_FOUND: "The requested resource was not found",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/", // New root dashboard page (workspace selector)
  WORKSPACE: (id: string) => `/workspace/${id}`,
  WORKSPACE_SETTINGS: (id: string) => `/workspace/${id}/settings`,
  WORKSPACE_BOTS: (id: string) => `/workspace/${id}/bots`,
  WORKSPACE_COURSES: (id: string) => `/workspace/${id}/courses`,
  WORKSPACE_POSTS: (id: string) => `/workspace/${id}/posts`,
  WORKSPACE_SUBSCRIBERS: (id: string) => `/workspace/${id}/subscribers`,
  WORKSPACE_ANALYTICS: (id: string) => `/workspace/${id}/analytics`,
};
