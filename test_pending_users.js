// Test script to check if pending users are correctly retrieved
import { getPendingUsers } from './supabase/database.js';

async function testPendingUsers() {
  try {
    console.log('Testing getPendingUsers function...');
    const pendingUsers = await getPendingUsers();
    console.log('Pending users:', pendingUsers);
    
    if (pendingUsers.length === 0) {
      console.log('No pending users found.');
    } else {
      console.log(`Found ${pendingUsers.length} pending users:`);
      pendingUsers.forEach(user => {
        console.log(`- ${user.email} (ID: ${user.id})`);
      });
    }
  } catch (error) {
    console.error('Error testing pending users:', error);
  }
}

testPendingUsers();
