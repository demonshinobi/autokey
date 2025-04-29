// This script will update the pending user template in autokey.js

const fs = require('fs');
const path = require('path');

// Read the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');
let content = fs.readFileSync(autokeyPath, 'utf8');

// Find the pending user template
const pendingUserTemplatePattern = /\/\/ Pending user[\s\S]*?userItem\.innerHTML = `[\s\S]*?`;/;
const pendingUserTemplateMatch = content.match(pendingUserTemplatePattern);

if (pendingUserTemplateMatch) {
    // Extract the pending user template
    const pendingUserTemplate = pendingUserTemplateMatch[0];
    
    // Create the new template
    const newTemplate = `// Pending user
                    pendingCount++;
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.innerHTML = \`
                        <div class="user-email">\${user.email}</div>
                        <div class="user-actions">
                            <button class="approve-button" data-user-id="\${user.id}" data-user-email="\${user.email}">Approve</button>
                            <button class="deny-button" data-user-id="\${user.id}" data-user-email="\${user.email}">Deny</button>
                        </div>
                    \``;
    
    // Replace the pending user template with the new one
    content = content.replace(pendingUserTemplate, newTemplate);
    
    // Write the updated content back to the file
    fs.writeFileSync(autokeyPath, content, 'utf8');
    
    console.log('Successfully updated the pending user template in autokey.js');
} else {
    console.log('Pending user template not found');
}
