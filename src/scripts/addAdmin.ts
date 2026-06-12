import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { ENV } from '../config/environment';
import { auth } from '../lib/auth';

async function addAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const passwordArg = args.find(arg => arg.startsWith('--password='));

  const email = emailArg ? emailArg.split('=')[1] : ENV.ADMIN_EMAIL;
  const password = passwordArg ? passwordArg.split('=')[1] : ENV.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: Admin email and password are required. Provide them via env variables (ADMIN_EMAIL, ADMIN_PASSWORD) or command line arguments (--email=..., --password=...).');
    process.exit(1);
  }

  const client = new MongoClient(ENV.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('user');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      if (existingUser.role === 'admin') {
        console.log('User is already an admin.');
        return;
      } else {
        console.log('User exists but is not an admin. Upgrading to admin...');
        await usersCollection.updateOne({ _id: existingUser._id }, { $set: { role: 'admin', emailVerified: true } });
        console.log('User upgraded to admin successfully.');
        return;
      }
    }

    console.log(`Creating admin user: ${email}...`);
    
    // Use Better Auth's internal API to sign up the user
    // Since we are in a script, we can simulate a request or use internal methods.
    // Better Auth doesn't have a simple "createUser" method.
    // We can use auth.api.signUpEmail but it might be complex to mock the request.
    
    // Alternative: Use a temporary dummy request to sign up.
    // But that's overkill.
    
    // Let's use the Better Auth internal password hashing if possible.
    // Better Auth uses a specific hashing algorithm.
    
    // Actually, the most reliable way to create a user in Better Auth is to call its API.
    // We can use `fetch` to call the local server if it's running, but the script should work standalone.
    
    // Wait, Better Auth provides a `signUpEmail` method in its API.
    // Let's try to use it by mocking the request.
    
    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: 'Administrator',
            },
        });
        
        // After sign up, we must set the role to admin and mark as verified.
        await usersCollection.updateOne(
            { email },
            { $set: { role: 'admin', emailVerified: true } }
        );
        
        console.log('Admin user created and verified successfully.');
    } catch (error: any) {
        console.error('Error creating user via Better Auth API:', error.message);
        process.exit(1);
    }

  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addAdmin();
