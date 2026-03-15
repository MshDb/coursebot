/**
 * Custom application errors for consistent error handling and translation keys
 */

export class AppError extends Error {
  public code: string;
  public status: number;
  public isOperational: boolean;

  constructor(message: string, code = "INTERNAL_SERVER_ERROR", status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.isOperational = true; // Indicates it's an expected app error, not a bug

    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, "FORBIDDEN", 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Invalid request") {
    super(message, "BAD_REQUEST", 400);
  }
}
