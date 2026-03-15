import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

export interface AuthResult {
  user: SafeUser;
}

export type RegisterResult = AuthResult;
