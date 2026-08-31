import { connectDB } from './src/config/db';
import { auth } from './src/lib/auth';
import { UserModel } from './src/models/User';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
};

const usersToCreate: SeedUser[] = [
  {
    name: 'user test',
    email: 'user@test.com',
    password: 'usertest',
    role: 'user',
  },
  {
    name: 'employee test',
    email: 'employee@test.com',
    password: 'employeetest',
    role: 'user',
  },
];

async function ensureUser({ name, email, password, role = 'user' }: SeedUser) {
  const normalizedEmail = email.toLowerCase();

  try {
    await auth.api.signUpEmail({
      body: {
        email: normalizedEmail,
        password,
        name,
      },
    });
    console.log(`Created auth user for ${normalizedEmail}`);
  } catch (error: any) {
    const message = error?.message || String(error);
    if (/already exists|duplicate|exists/i.test(message)) {
      console.log(`User ${normalizedEmail} already exists; continuing with verification update.`);
    } else {
      throw error;
    }
  }

  await UserModel.updateOne(
    { email: normalizedEmail },
    {
      name,
      email: normalizedEmail,
      role,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
    { upsert: true }
  );

  console.log(`Verified and updated ${normalizedEmail} with emailVerified=true`);
}

async function main() {
  await connectDB();

  for (const user of usersToCreate) {
    await ensureUser(user);
  }

  console.log('Temporary user creation complete.');
}

main().catch((error) => {
  console.error('Temporary user script failed:', error);
  process.exit(1);
});
