// This script will fix the issues in autokey.js

const fs = require('fs');
const path = require('path');

// Read the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');
let content = fs.readFileSync(autokeyPath, 'utf8');

// 1. Replace the hardcoded users with Supabase fetch
const hardcodedUsersPattern = /\/\/ Use hardcoded data for now until database issues are fixed[\s\S]*?console\.log\('Using hardcoded users for now:', users\);/;
if (content.match(hardcodedUsersPattern)) {
    const fetchUsersReplacement = `// Fetch users from Supabase
            console.log('Fetching users from Supabase...');
            
            // Get active users
            const { data: activeUsers, error: activeError } = await supabase
                .from('user_access')
                .select('*')
                .eq('approved', true);
                
            if (activeError) {
                console.error('Error fetching active users:', activeError);
                showToast('Error fetching active users', 'error');
                return;
            }
            
            // Get pending users
            const { data: pendingUsers, error: pendingError } = await supabase
                .from('user_access')
                .select('*')
                .eq('approved', false);
                
            if (pendingError) {
                console.error('Error fetching pending users:', pendingError);
                showToast('Error fetching pending users', 'error');
                return;
            }
            
            // Combine users and deduplicate by email
            const emailMap = new Map();
            
            // Add active users first
            activeUsers.forEach(user => {
                if (!emailMap.has(user.email)) {
                    emailMap.set(user.email, {
                        ...user,
                        approved: true
                    });
                }
            });
            
            // Add pending users
            pendingUsers.forEach(user => {
                if (!emailMap.has(user.email)) {
                    emailMap.set(user.email, {
                        ...user,
                        approved: false
                    });
                }
            });
            
            // Convert map to array
            const users = Array.from(emailMap.values());
            
            console.log('Fetched users from Supabase:', users);`;

    content = content.replace(hardcodedUsersPattern, fetchUsersReplacement);
    console.log('Replaced hardcoded users with Supabase fetch');
} else {
    console.log('Hardcoded users already replaced');
}

// 2. Add the pending user template
// First, find the section where the pending user template should be
const pendingUserPattern = /\/\/ Pending user[\s\S]*?userItem\.innerHTML = `[\s\S]*?`;/;
if (content.match(pendingUserPattern)) {
    const newPendingUserTemplate = `// Pending user
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

    content = content.replace(pendingUserPattern, newPendingUserTemplate);
    console.log('Updated pending user template');
} else {
    console.log('Pending user template not found');
}

// 3. Update the approve button event listener
const approveButtonPattern = /const approveButton = userItem\.querySelector\('\.approve-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;
if (content.match(approveButtonPattern)) {
    const newApproveButtonCode = `const approveButton = userItem.querySelector('.approve-button');
                    approveButton.addEventListener('click', async () => {
                        const userId = approveButton.getAttribute('data-user-id');
                        const userEmail = approveButton.getAttribute('data-user-email');
                        
                        try {
                            // Update the user in Supabase
                            const { data, error } = await supabase
                                .from('user_access')
                                .update({ approved: true, updated_at: new Date().toISOString() })
                                .eq('email', userEmail);
                                
                            if (error) {
                                console.error('Error approving user:', error);
                                showToast(\`Error approving user: \${error.message}\`, 'error');
                                return;
                            }
                            
                            showToast(\`User \${userEmail} approved\`, 'success');
                            populateUserLists();
                        } catch (error) {
                            console.error('Error approving user:', error);
                            showToast(\`Error approving user: \${error.message}\`, 'error');
                        }
                    });`;

    content = content.replace(approveButtonPattern, newApproveButtonCode);
    console.log('Updated approve button event listener');
} else {
    console.log('Approve button event listener not found');
}

// 4. Update the deny button event listener
const denyButtonPattern = /const denyButton = userItem\.querySelector\('\.deny-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;
if (content.match(denyButtonPattern)) {
    const newDenyButtonCode = `const denyButton = userItem.querySelector('.deny-button');
                    denyButton.addEventListener('click', async () => {
                        const userId = denyButton.getAttribute('data-user-id');
                        const userEmail = denyButton.getAttribute('data-user-email');
                        
                        try {
                            // Delete the user from Supabase
                            const { data, error } = await supabase
                                .from('user_access')
                                .delete()
                                .eq('email', userEmail);
                                
                            if (error) {
                                console.error('Error denying user:', error);
                                showToast(\`Error denying user: \${error.message}\`, 'error');
                                return;
                            }
                            
                            showToast(\`User \${userEmail} denied\`, 'success');
                            populateUserLists();
                        } catch (error) {
                            console.error('Error denying user:', error);
                            showToast(\`Error denying user: \${error.message}\`, 'error');
                        }
                    });`;

    content = content.replace(denyButtonPattern, newDenyButtonCode);
    console.log('Updated deny button event listener');
} else {
    console.log('Deny button event listener not found');
}

// Write the updated content back to the file
fs.writeFileSync(autokeyPath, content, 'utf8');

console.log('Successfully updated autokey.js');
