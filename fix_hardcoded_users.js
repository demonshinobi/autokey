// This script will fix the hardcoded users in autokey.js
// Run it with: node fix_hardcoded_users.js

const fs = require('fs');
const path = require('path');

// Path to the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');

// Read the file
let content = fs.readFileSync(autokeyPath, 'utf8');

// Replace the hardcoded users section
const hardcodedUsersPattern = /\/\/ Use hardcoded data for now until database issues are fixed[\s\S]*?console\.log\('Using hardcoded users for now:', users\);/;

const replacement = `// Fetch users from Supabase
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

content = content.replace(hardcodedUsersPattern, replacement);

// Fix the pending user HTML template
const pendingUserTemplatePattern = /\/\/ Pending user[\s\S]*?userItem\.innerHTML = `[\s\S]*?`;/;

const templateReplacement = `// Pending user
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

content = content.replace(pendingUserTemplatePattern, templateReplacement);

// Fix the approve button event listener
const approveButtonPattern = /const approveButton = userItem\.querySelector\('\.approve-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;

const approveButtonReplacement = `const approveButton = userItem.querySelector('.approve-button');
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

content = content.replace(approveButtonPattern, approveButtonReplacement);

// Fix the deny button event listener
const denyButtonPattern = /const denyButton = userItem\.querySelector\('\.deny-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;

const denyButtonReplacement = `const denyButton = userItem.querySelector('.deny-button');
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

content = content.replace(denyButtonPattern, denyButtonReplacement);

// Write the updated content back to the file
fs.writeFileSync(autokeyPath, content, 'utf8');

console.log('Successfully updated autokey.js');
