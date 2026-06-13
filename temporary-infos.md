I have successfully replaced the custom authentication system with Better Auth.
Summary of Changes
1. Removed Custom Auth
- Files Deleted:
- src/controllers/authController.ts
- src/routes/authRoutes.ts
- src/validations/authValidation.ts
- src/utils/password.ts
- Dependencies Removed: jsonwebtoken, bcryptjs (and their corresponding @types).
- Logic Removed: Custom JWT generation/verification, image-based signup verification, and custom password hashing.
2. Better Auth Implementation
- Configuration: Created src/lib/auth.ts using the MongoDB adapter.
- Handler: Mounted the Better Auth handler in src/app.ts at /api/auth/*.
- Features Enabled:
- Email/Password authentication.
- Email verification for normal users.
- Password reset functionality.
- Role-based access control (User and Admin roles).
3. Environment Updates
- Removed: JWT_SECRET, AUTH_SECRET, RESET_TOKEN_EXPIRY_MINUTES.
- Added:
- BETTER_AUTH_SECRET: Secret for session management.
- BETTER_AUTH_URL: Base URL for auth endpoints.
- ADMIN_EMAIL: Email for the default admin.
- ADMIN_PASSWORD: Password for the default admin.
4. User Model & Middleware
- User Model: Refactored src/models/User.ts to remove image verification fields and add emailVerified.
- Middleware: Implemented new session-based middleware in src/middleware/auth.ts:
- requireAuth: Ensures the user is logged in.
- requireVerifiedUser: Allows admins or verified normal users.
- requireAdmin: Allows only users with the admin role.
5. Admin Management
- Scripts: Created src/scripts/addAdmin.ts and src/scripts/deleteAdmin.ts.
- npm Scripts: Added admin:add and admin:delete to package.json.
- Admin Workflow: Admins are created via script, are marked as verified by default, and bypass email verification checks.
6. Route Updates
- Updated all protected routes (Cart, Orders, Products, User Profile, and Admin Dashboard) to use the new role-based and verification-based middleware.
Setup and Usage
1. Install dependencies: npm install
2. Configure environment: Add BETTER_AUTH_SECRET, BETTER_AUTH_URL, ADMIN_EMAIL, and ADMIN_PASSWORD to your .env file.
3. Create the first admin:
npm run admin:add
(Alternatively: npm run admin:add -- --email admin@example.com --password yourpassword)
4. Run the server: npm run dev




//
The admin authentication process follows this flow:
1. Admin Creation (Seeding)
Admins are created via a standalone script (src/scripts/addAdmin.ts):
- User Creation: It calls auth.api.signUpEmail to create a user record with a password.
- Privilege Escalation: It manually updates the MongoDB user collection to set role: 'admin' and emailVerified: true for that email.
2. Login Process
- Authentication: The system uses Better Auth (src/lib/auth.ts). The admin logs in using a standard email/password flow.
- Verification: Better Auth's MongoDB adapter matches the credentials against the database. If they match, a session is created.
3. Access Control (Middleware)
Every request to an admin endpoint is filtered through middleware in src/middleware/auth.ts:
- Session Validation: requireAuth verifies the session via auth.api.getSession.
- Role Verification: requireAdmin checks if the authenticated user's role is exactly 'admin'. If not, it returns a 403 Administrator access required error.
- Verification Bypass: In requireVerifiedUser, admins are explicitly allowed to bypass email verification checks.