import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { ENV } from '../config/environment';

async function deleteAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));

  const email = emailArg ? emailArg.split('=')[1] : ENV.ADMIN_EMAIL;

  if (!email) {
    console.error('Error: Admin email is required. Provide it via env variable (ADMIN_EMAIL) or command line argument (--email=...).');
    process.exit(1);
  }

  const client = new MongoClient(ENV.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.log(`No user found with email ${email}.`);
      return;
    }

    if (user.role !== 'admin') {
      console.error(`Error: User ${email} is not an admin. Only admin accounts can be deleted by this script.`);
      process.exit(1);
    }

    await usersCollection.deleteOne({ _id: user._id });
    
    // Also delete associated sessions and accounts if they exist
    await db.collection('session').deleteMany({ userId: user._id });
    await db.collection('account').deleteMany({ userId: user._id });

    console.log(`Admin user ${email} deleted successfully.`);
  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

deleteAdmin();
