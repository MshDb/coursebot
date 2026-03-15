import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/modules/auth/service";
import bcrypt from "bcryptjs";
import { BadRequestError } from "@/lib/errors";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("mocked_hash"),
    compare: vi.fn(),
  },
}));

const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any;

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    const validInput = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    it("should successfully register a new user and hash password", async () => {
      mockDb.user.findUnique.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue({
        id: "user_1",
        email: validInput.email,
        passwordHash: "mocked_hash",
        firstName: validInput.firstName,
        lastName: validInput.lastName,
      });

      const result = await AuthService.register(mockDb, validInput);

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: validInput.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(validInput.password, 12);
      expect(mockDb.user.create).toHaveBeenCalled();

      // Should not return passwordHash
      expect(result.user).not.toHaveProperty("passwordHash");
      expect(result.user.email).toBe(validInput.email);
    });

    it("should throw BadRequestError if email is already in use", async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: "existing_user" });

      await expect(AuthService.register(mockDb, validInput)).rejects.toThrow(BadRequestError);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockDb.user.create).not.toHaveBeenCalled();
    });
  });
});
