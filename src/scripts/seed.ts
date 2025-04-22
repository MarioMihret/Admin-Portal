// @ts-check
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
config({ path: join(process.cwd(), '.env') });

async function seedDatabase() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  let client: MongoClient | null = null;

  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get list of collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check if 'role' collection exists, create it if it doesn't
    if (!collectionNames.includes('role')) {
      console.log('Creating role collection...');
      await db.createCollection('role');
      console.log('Role collection created successfully');
    } else {
      console.log('Role collection already exists');
    }
    
    const rolesCollection = db.collection('role');
    
    // Check if super-admin already exists
    const existingSuperAdmin = await rolesCollection.findOne({ role: 'super-admin' });
    
    if (!existingSuperAdmin) {
      // Create super-admin user with temporary password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('ChangeMe123!', salt);
      
      const now = new Date();
      await rolesCollection.insertOne({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        role: 'super-admin',
        isActive: true,
        requirePasswordChange: false,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
        lastPasswordChange: now,
      });
      
      console.log('\u2705 Super admin created successfully');
    } else {
      console.log('\u2139ufe0f Super admin already exists');
    }
    
    // Check if admin already exists
    const existingAdmin = await rolesCollection.findOne({ role: 'admin', email: 'admin@example.com' });
    
    if (!existingAdmin) {
      // Create admin user with temporary password
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('ChangeMe123!', salt);
      
      const now = new Date();
      await rolesCollection.insertOne({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        requirePasswordChange: false,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
        lastPasswordChange: now,
      });
      
      console.log('\u2705 Admin user created successfully');
    } else {
      console.log('\u2139ufe0f Admin user already exists');
    }
    
    console.log('\u2705 Database seeding completed');
    
  } catch (error) {
    console.error('\u274c Error seeding database:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the seeding function
seedDatabase(); 