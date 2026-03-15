import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RegisterInput } from "./schema";
import { RegisterResult } from "./types";
import { AUTH_ERRORS, BCRYPT_SALT_ROUNDS } from "./constants";
import { BadRequestError } from "@/lib/errors";

export const AuthService = {
  /**
   * Registers a new user. Hashes the password with bcrypt (FR-002).
   */
  async register(db: PrismaClient, input: RegisterInput): Promise<RegisterResult> {
    const { email, password, firstName, lastName } = input;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Per spec: return generic error to prevent email enumeration, but
      // standard practice for generic APIs is to throw the error and let UI handle phrasing
      throw new BadRequestError(AUTH_ERRORS.EMAIL_IN_USE);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Strip password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser };
  },

  // Note: the login flow explicitly happens inside Auth.js `authorize` callback.
  // The session establishment (FR-003) is handled automatically by NextAuth + PrismaAdapter
  // when the credentials provider `authorize` succeeds.
};
