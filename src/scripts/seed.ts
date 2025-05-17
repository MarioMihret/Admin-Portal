// @ts-check
import { MongoClient } from 'mongodb';
import bcryptjs from 'bcryptjs';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
config({ path: join(process.cwd(), '.env') });

const DEFAULT_UNIVERSITY = "Woldia University"; // Define the default university

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
    
    // Ensure 'role' collection exists
    if (!collectionNames.includes('role')) {
      console.log('Creating role collection...');
      await db.createCollection('role');
      console.log('Role collection created successfully');
    } else {
      console.log('Role collection already exists');
    }
    const rolesCollection = db.collection('role');

    // Ensure 'adminusers' collection exists (for AdminUser model)
    // Mongoose typically pluralizes model names. Adjust if your collection name is different.
    const adminUsersCollectionName = 'adminusers';
    if (!collectionNames.includes(adminUsersCollectionName)) {
      console.log(`Creating ${adminUsersCollectionName} collection...`);
      await db.createCollection(adminUsersCollectionName);
      console.log(`${adminUsersCollectionName} collection created successfully`);
    } else {
      console.log(`${adminUsersCollectionName} collection already exists`);
    }
    const adminUsersCollection = db.collection(adminUsersCollectionName);
    
    // Seed Super Admin
    let superAdminEmail = 'superadmin@example.com';
    let superAdminRoleEntry = await rolesCollection.findOne({ email: superAdminEmail });
    if (!superAdminRoleEntry) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('ChangeMe123!', salt);
      const now = new Date();
      await rolesCollection.insertOne({
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'super-admin',
        isActive: true,
        requirePasswordChange: false,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
        lastPasswordChange: now,
      });
      superAdminRoleEntry = await rolesCollection.findOne({ email: superAdminEmail }); // Re-fetch to get _id and full doc
      console.log('\u2705 Super admin created successfully in role collection');
    } else {
      console.log('\u2139ufe0f Super admin already exists in role collection');
    }

    // Link Super Admin to Default University in adminusers collection
    if (superAdminRoleEntry) {
      const existingSuperAdminLink = await adminUsersCollection.findOne({ email: superAdminRoleEntry.email, university: DEFAULT_UNIVERSITY });
      if (!existingSuperAdminLink) {
        await adminUsersCollection.insertOne({
          name: superAdminRoleEntry.name,
          email: superAdminRoleEntry.email,
          // Ensure superAdminRoleEntry.password exists before accessing it
          passwordHash: superAdminRoleEntry.password as string, 
          role: 'Super Admin', 
          university: DEFAULT_UNIVERSITY,
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`\u2705 Super admin linked to ${DEFAULT_UNIVERSITY} in ${adminUsersCollectionName} collection`);
      } else {
        console.log(`\u2139ufe0f Super admin already linked to ${DEFAULT_UNIVERSITY} in ${adminUsersCollectionName} collection`);
      }
    }
    
    // Seed Admin User
    let adminEmail = 'admin@example.com';
    let adminRoleEntry = await rolesCollection.findOne({ email: adminEmail });
    if (!adminRoleEntry) {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash('ChangeMe123!', salt);
      const now = new Date();
      await rolesCollection.insertOne({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        requirePasswordChange: false,
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
        lastPasswordChange: now,
      });
      adminRoleEntry = await rolesCollection.findOne({ email: adminEmail }); // Re-fetch to get _id and full doc
      console.log('\u2705 Admin user created successfully in role collection');
    } else {
      console.log('\u2139ufe0f Admin user already exists in role collection');
    }

    // Link Admin User to Default University in adminusers collection
    if (adminRoleEntry) {
      const existingAdminLink = await adminUsersCollection.findOne({ email: adminRoleEntry.email, university: DEFAULT_UNIVERSITY });
      if (!existingAdminLink) {
        await adminUsersCollection.insertOne({
          name: adminRoleEntry.name,
          email: adminRoleEntry.email,
          // Ensure adminRoleEntry.password exists before accessing it
          passwordHash: adminRoleEntry.password as string, 
          role: 'Admin', 
          university: DEFAULT_UNIVERSITY,
          status: 'Active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`\u2705 Admin user linked to ${DEFAULT_UNIVERSITY} in ${adminUsersCollectionName} collection`);
      } else {
        console.log(`\u2139ufe0f Admin user already linked to ${DEFAULT_UNIVERSITY} in ${adminUsersCollectionName} collection`);
      }
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