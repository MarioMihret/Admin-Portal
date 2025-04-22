const { MongoClient } = require('mongodb');

async function checkSuperAdmin() {
  try {
    const client = new MongoClient('mongodb://localhost:27017/event');
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const superadmin = await db.collection('role').findOne({ email: 'superadmin@example.com' });
    
    console.log('SuperAdmin record:');
    console.log(JSON.stringify(superadmin, null, 2));
    
    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkSuperAdmin(); 