// This script will update the approve and deny button event listeners in autokey.js

const fs = require('fs');
const path = require('path');

// Read the autokey.js file
const autokeyPath = path.join(__dirname, 'autokey.js');
let content = fs.readFileSync(autokeyPath, 'utf8');

// Find the approve button event listener
const approveButtonPattern = /const approveButton = userItem\.querySelector\('\.approve-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;
const approveButtonMatch = content.match(approveButtonPattern);

if (approveButtonMatch) {
    // Extract the approve button event listener
    const approveButtonListener = approveButtonMatch[0];
    
    // Create the new approve button event listener
    const newApproveButtonListener = `const approveButton = userItem.querySelector('.approve-button');
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
    
    // Replace the approve button event listener with the new one
    content = content.replace(approveButtonListener, newApproveButtonListener);
    
    // Find the deny button event listener
    const denyButtonPattern = /const denyButton = userItem\.querySelector\('\.deny-button'\);[\s\S]*?populateUserLists\(\);[\s\S]*?\}\);/;
    const denyButtonMatch = content.match(denyButtonPattern);
    
    if (denyButtonMatch) {
        // Extract the deny button event listener
        const denyButtonListener = denyButtonMatch[0];
        
        // Create the new deny button event listener
        const newDenyButtonListener = `const denyButton = userItem.querySelector('.deny-button');
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
        
        // Replace the deny button event listener with the new one
        content = content.replace(denyButtonListener, newDenyButtonListener);
        
        // Write the updated content back to the file
        fs.writeFileSync(autokeyPath, content, 'utf8');
        
        console.log('Successfully updated the approve and deny button event listeners in autokey.js');
    } else {
        console.log('Deny button event listener not found');
    }
} else {
    console.log('Approve button event listener not found');
}
