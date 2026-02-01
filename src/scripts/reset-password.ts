
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
config({ path: join(process.cwd(), '.env') });
// Also try .env.local if .env doesn't exist or MONGODB_URI is missing
if (!process.env.MONGODB_URI) {
  config({ path: join(process.cwd(), '.env.local') });
}

async function resetPassword() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env or .env.local');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const rolesCollection = db.collection('role');
    
    const email = 'admin@example.com';
    const newPassword = 'ChangeMe123!';
    
    console.log(`Resetting password for ${email}...`);
    
    const user = await rolesCollection.findOne({ email });
    
    if (!user) {
      console.error(`User ${email} not found!`);
      // Optional: Create the user if missing? No, user logs showed user exists.
      process.exit(1);
    }
    
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);
    
    await rolesCollection.updateOne(
      { email },
      { 
        $set: { 
          password: hashedPassword,
          failedLoginAttempts: 0 // Reset failed attempts too
        } 
      }
    );
    
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
    console.log('Failed login attempts have been reset to 0.');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

resetPassword();
