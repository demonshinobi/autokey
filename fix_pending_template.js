// This script will fix the pending user template in autokey.js

const fs = require('fs');
const path = require('path');

// Read the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');
let content = fs.readFileSync(autokeyPath, 'utf8');

// Find the pending user template
const pendingUserTemplate = `                    // Pending user
                    pendingCount++;
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.innerHTML = \`
                        <div class="user-actions">
                        </div>
                    \`;`;

// Create the new template
const newTemplate = `                    // Pending user
                    pendingCount++;
                    const userItem = document.createElement('div');
                    userItem.className = 'user-item';
                    userItem.innerHTML = \`
                        <div class="user-email">\${user.email}</div>
                        <div class="user-actions">
                            <button class="approve-button" data-user-id="\${user.id}" data-user-email="\${user.email}">Approve</button>
                            <button class="deny-button" data-user-id="\${user.id}" data-user-email="\${user.email}">Deny</button>
                        </div>
                    \`;`;

// Replace the template
content = content.replace(pendingUserTemplate, newTemplate);

// Write the updated content back to the file
fs.writeFileSync(autokeyPath, content, 'utf8');

console.log('Successfully updated the pending user template in autokey.js');
