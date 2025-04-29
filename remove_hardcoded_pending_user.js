// This script will remove the hardcoded pending user from autokey.js

const fs = require('fs');
const path = require('path');

// Read the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');
let content = fs.readFileSync(autokeyPath, 'utf8');

// Find the hardcoded users array
const hardcodedUsersPattern = /const users = \[\s*{[\s\S]*?}\s*\];/;
const hardcodedUsersMatch = content.match(hardcodedUsersPattern);

if (hardcodedUsersMatch) {
    // Extract the hardcoded users array
    const hardcodedUsers = hardcodedUsersMatch[0];
    
    // Remove the pending user from the array
    const updatedUsers = hardcodedUsers.replace(/,\s*{\s*id: ['"]4['"],\s*email: ['"]pending\.user@example\.com['"],\s*approved: false,\s*is_admin: false,\s*created_at: new Date\(\)\.toISOString\(\)\s*}/g, '');
    
    // Replace the hardcoded users array with the updated one
    content = content.replace(hardcodedUsers, updatedUsers);
    
    // Write the updated content back to the file
    fs.writeFileSync(autokeyPath, content, 'utf8');
    
    console.log('Successfully removed the hardcoded pending user from autokey.js');
} else {
    console.log('Hardcoded users array not found');
}
