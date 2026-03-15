# Auth Module

**Purpose**: Handles user authentication, registration, and session management for the CourseBot platform.
**Key Entities**: `User`, `Session` (managed via NextAuth)

## Architecture

- **Adapter**: Uses `@auth/prisma-adapter` for database synchronization.
- **Provider**: Uses `Credentials` (Email + Password) with `bcryptjs` for hashing.
- **Session Strategy**: Database sessions (`strategy: "database"`), enforcing secure lookups.
- **tRPC API**: The `register` procedure is exposed publicly to allow account creation.
- **NextAuth API**: Core login and session endpoint interactions happen over Next.js API Routes at `/api/auth/[...nextauth]`.

## Public API

- `AuthService.register(db, input)`: Creates a new user securely, throws `BadRequestError` if email exists. Returns a sanitized `SafeUser`.
- `authRouter`: tRPC router exposing `.register()`.
- `logoutAction()`: Server action invoking `signOut()` safely.
