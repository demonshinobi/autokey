import { signIn, signUp, signOut, getSession, isUserAdmin, onAuthStateChange } from './supabase/auth.js';
import { uploadCSVData, getAllCompanyCredentials, getMostRecentCSVFile, getAllUsers, updateUserRole } from './supabase/database.js';

// Simple version without modules
console.log('AutoKey extension loaded - simplified version');

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded event fired.');

    // Add animation class to body after DOM is loaded for initial animation
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Initialize UI elements with animations
    const initUI = () => {
        const formGroups = document.querySelectorAll('.form-group');
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                group.classList.add('visible');
            }, 100 + (index * 100));
        });

        setTimeout(() => {
            document.querySelector('.action-button').classList.add('visible');
        }, 500);
    };

    // Call initUI after a short delay
    setTimeout(initUI, 300);


// --- UI Elements ---
// Get references to the elements we need
const loginButton = document.getElementById('login-button');
console.log('[DEBUG] loginButton element:', loginButton);

const loggedOutControls = document.getElementById('logged-out-controls');
const loggedInControls = document.getElementById('logged-in-controls');
const userMenuButton = document.getElementById('user-menu-button');
const userDropdown = document.getElementById('user-dropdown');
const userInitial = document.getElementById('user-initial');
const userEmail = document.getElementById('user-email');
const userRole = document.getElementById('user-role');
const logoutButton = document.getElementById('logout-button');
const adminPanelButton = document.getElementById('admin-panel-button');

// Login modal elements
const loginModal = document.getElementById('login-modal');
const closeModal = document.getElementById('close-modal');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginSubmit = document.getElementById('login-submit');
const signupSubmit = document.getElementById('signup-submit');

// Admin modal elements
const adminModal = document.getElementById('admin-modal');
const closeAdminModal = document.getElementById('close-admin-modal');
const csvTab = document.getElementById('csv-tab');
const usersTab = document.getElementById('users-tab');
const csvManagement = document.getElementById('csv-management');
const userManagement = document.getElementById('user-management');

// Main content elements
const mainContent = document.getElementById('main-content');
const csvFileInput = document.getElementById('csvFileInput');
const companySelect = document.getElementById('companySelect');
const uidInput = document.getElementById('uidInput');
const usernameInput = document.getElementById('usernameInput');
const platformInput = document.getElementById('platformInput');
const fillButton = document.getElementById('fillButton');
const fileInfoDisplay = document.getElementById('fileInfoDisplay');

// --- State Variables ---
let currentUser = null;
let isAdmin = false;
let companyCredentialsCache = []; // Cache for credentials fetched from Supabase

// --- CSV Parsing Function (Still needed for upload) ---
function parseCSV(csvText) {
        console.log("Starting CSV parse...");
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            console.error("CSV needs at least a header and one data row.");
            return null;
        }

        // Extract headers from file, trimming whitespace
        const fileHeaders = lines[0].split(',').map(header => header.trim());
        console.log("File Headers Found:", fileHeaders);

        // Define expected headers (using user-specified case for 'instance')
        const expectedHeaders = ["Account Name", "username", "AccountUid", "instance"];
        console.log("Expected Headers:", expectedHeaders);

        // --- Robust Header Mapping ---
        // Find the index of each expected header in the file headers (case-insensitive)
        const headerIndexMap = {};
        let missingHeaders = [];
        expectedHeaders.forEach(expectedHeader => {
            const foundIndex = fileHeaders.findIndex(fileHeader => fileHeader.toLowerCase() === expectedHeader.toLowerCase());
            if (foundIndex !== -1) {
                // Store the index using the *expected* header key for consistency
                headerIndexMap[expectedHeader] = foundIndex;
            } else {
                missingHeaders.push(expectedHeader);
            }
        });

        // Check if all expected headers were found
        if (missingHeaders.length > 0) {
            console.error(`CSV is missing required headers: ${missingHeaders.join(', ')}. Found headers: ${fileHeaders.join(', ')}`);
            return null; // Stop parsing if essential headers are missing
        }
        console.log("Header Index Map:", headerIndexMap);

        // --- Data Row Processing ---
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            // Handle potential commas within quoted fields (basic handling)
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(value => {
                // Trim whitespace and remove surrounding quotes if present
                let trimmedValue = value.trim();
                if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
                    trimmedValue = trimmedValue.substring(1, trimmedValue.length - 1);
                }
                return trimmedValue;
            });


            // Basic check for column count consistency - might be less reliable with commas in fields
            // if (values.length !== fileHeaders.length) {
            //     console.warn(`Skipping row ${i + 1} due to potential column count mismatch. Expected approx ${fileHeaders.length}, found ${values.length}. Line: "${lines[i]}"`);
            //     continue; // Skip rows that seem malformed
            // }

            const entry = {};
            let skipRow = false;
            // Use the headerIndexMap to populate the entry object with consistent keys
            for (const expectedHeader in headerIndexMap) {
                const index = headerIndexMap[expectedHeader];
                if (index < values.length) { // Ensure index is within bounds for the current row
                    entry[expectedHeader] = values[index];
                } else {
                    console.warn(`Skipping row ${i + 1}: Expected data for header "${expectedHeader}" at index ${index}, but row only has ${values.length} values.`);
                    skipRow = true;
                    break; // Stop processing this row
                }
            }

            if (!skipRow) {
                 // Optional: Add validation here if certain fields cannot be empty
                 if (!entry["Account Name"]) {
                     console.warn(`Skipping row ${i + 1} because 'Account Name' is empty.`);
                     continue;
                 }
                data.push(entry);
            }
        }
        console.log(`CSV parsing finished. Processed ${lines.length - 1} data rows, successfully parsed ${data.length} entries.`);
        return data;
    }

    // --- Populate Dropdown Function (Will be updated later) ---
    function populateDropdown(companyData) {
        console.log('[populateDropdown] Received companyData:', JSON.stringify(companyData)); // Log received data
        console.log('[populateDropdown] companySelect element:', companySelect); // Log element reference
        companyCredentialsCache = companyData || []; // Update cache (using new variable)
        // Clear existing options except the first one ("-- Select Company --")
        console.log(`[populateDropdown] Before clearing: ${companySelect.options.length} options`);
        while (companySelect.options.length > 1) {
            companySelect.remove(1);
        }
        console.log(`[populateDropdown] After clearing: ${companySelect.options.length} options`);

        if (companyCredentialsCache && companyCredentialsCache.length > 0) {
            companyCredentialsCache.forEach(company => {
                console.log(`[populateDropdown] Processing company: ${company['Account Name']}`);
                const option = document.createElement('option');
                option.value = company["Account Name"];
                option.textContent = company["Account Name"];
                console.log(`[populateDropdown] Appending option for: ${option.textContent}`);
                companySelect.appendChild(option);
            });
            console.log(`[populateDropdown] Finished appending. Final options count: ${companySelect.options.length}`);
        } else {
            console.log("No company data found to populate dropdown.");
        }
    }
    // --- Update File Info Display Function ---
    function updateFileInfoDisplay(fileName, uploadDate) {
        const displayElement = document.getElementById('fileInfoDisplay');
        if (!displayElement) {
            console.error("Element with ID 'fileInfoDisplay' not found.");
            return;
        }
        if (fileName && uploadDate) {
            displayElement.textContent = `Loaded: ${fileName} (${uploadDate})`;
            displayElement.style.display = 'block'; // Make sure it's visible
        } else {
            displayElement.textContent = 'No CSV loaded'; // Or set to empty: ''
            displayElement.style.display = 'block'; // Keep it visible even when empty/default
        }
    }

    // Update UI based on authentication state
    async function updateUIBasedOnAuthState(user) {
        console.log('Updating UI based on auth state:', user);

        // Update current user and check admin status
        currentUser = user;
        isAdmin = user ? await isUserAdmin() : false;

        if (user) {
            // User is logged in
            console.log('User is logged in. Is admin:', isAdmin);

            // Show logged-in controls, hide logged-out controls
            if (loggedInControls) loggedInControls.classList.remove('hidden');
            if (loggedOutControls) loggedOutControls.classList.add('hidden');

            // Update user info in dropdown
            if (userInitial) userInitial.textContent = user.email.charAt(0).toUpperCase();
            if (userEmail) userEmail.textContent = user.email;
            if (userRole) userRole.textContent = isAdmin ? 'Admin' : 'User';

            // Show/hide admin panel button based on admin status
            if (adminPanelButton) {
                if (isAdmin) {
                    adminPanelButton.classList.remove('hidden');
                } else {
                    adminPanelButton.classList.add('hidden');
                }
            }

            // Show/hide CSV upload section based on email
            const fileInputWrapper = csvFileInput ? csvFileInput.closest('.file-input-wrapper') : null;
            if (fileInputWrapper) {
                if (user.email === 'joshua.cancel@kaseya.com') {
                    fileInputWrapper.style.display = 'block';
                    console.log('CSV upload visible - User is joshua.cancel@kaseya.com');
                } else {
                    fileInputWrapper.style.display = 'none';
                    console.log('CSV upload hidden - User is not joshua.cancel@kaseya.com');
                }
            }

            // Show main content
            if (mainContent) mainContent.style.display = 'block';

            // Load credentials from Supabase
            try {
                const credentials = await getAllCompanyCredentials();
                console.log('Loaded credentials:', credentials);
                populateDropdown(credentials);

                // Update file info if available
                if (credentials.length > 0 && credentials[0]._fileInfo) {
                    updateFileInfoDisplay(credentials[0]._fileInfo.name, credentials[0]._fileInfo.uploadDate);
                }
            } catch (error) {
                console.error('Error loading credentials:', error);
                showToast(`Error loading credentials: ${error.message}`, 'error');
            }

        } else {
            // User is logged out
            console.log('User is logged out');

            // Show logged-out controls, hide logged-in controls
            if (loggedOutControls) loggedOutControls.classList.remove('hidden');
            if (loggedInControls) loggedInControls.classList.add('hidden');

            // Clear user info
            if (userInitial) userInitial.textContent = '';
            if (userEmail) userEmail.textContent = '';
            if (userRole) userRole.textContent = '';

            // Hide admin panel button
            if (adminPanelButton) adminPanelButton.classList.add('hidden');

            // Show main content (we still want to show the UI even when logged out)
            if (mainContent) mainContent.style.display = 'block';

            // Clear dropdown
            populateDropdown([]);
            updateFileInfoDisplay(null, null);
        }
    }

    // We'll implement Supabase integration in the future


    // --- Authentication Event Listeners ---
    // Login button shows the login modal
    if (loginButton) {
        loginButton.addEventListener('click', () => {
        console.log('[DEBUG] Adding click listener to loginButton.');

            console.log('Login button clicked');
            if (loginModal) {
                loginModal.classList.add('visible');
            }
        });
    } else {
        console.warn("Login button not found in popup.html");
    }

    // Close modal button
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (loginModal) {
                loginModal.classList.remove('visible');
            }
        });
    }

    // Tab switching in login modal
    if (loginTab && signupTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
            if (signupForm) signupForm.classList.remove('active');
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            if (signupForm) signupForm.classList.add('active');
            if (loginForm) loginForm.classList.remove('active');
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            if (!emailInput || !passwordInput) {
                showToast('Login form inputs not found', 'error');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                showToast('Please enter both email and password', 'warning');
                return;
            }

            try {
                showToast('Logging in...', 'info');
                const { data, error } = await signIn(email, password);

                if (error) throw error;

                console.log('Login successful:', data);
                showToast('Login successful!', 'success');

                // Close the modal
                if (loginModal) {
                    loginModal.classList.remove('visible');
                }

                // Update UI based on auth state
                updateUIBasedOnAuthState(data.user);

            } catch (error) {
                console.error('Login error:', error);
                showToast(`Login failed: ${error.message}`, 'error');
            }
        });
    }

    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('signup-email');
            const passwordInput = document.getElementById('signup-password');
            const confirmInput = document.getElementById('signup-confirm');

            if (!emailInput || !passwordInput || !confirmInput) {
                showToast('Signup form inputs not found', 'error');
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmInput.value;

            if (!email || !password || !confirmPassword) {
                showToast('Please fill out all fields', 'warning');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'warning');
                return;
            }

            try {
                showToast('Creating account...', 'info');
                const { data, error } = await signUp(email, password);

                if (error) throw error;

                console.log('Signup successful:', data);
                showToast('Account created! Please check your email for verification.', 'success');

                // Switch to login tab
                if (loginTab) {
                    loginTab.click();
                }

            } catch (error) {
                console.error('Signup error:', error);
                showToast(`Signup failed: ${error.message}`, 'error');
            }
        });
    }

    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const { error } = await signOut();
                if (error) throw error;

                console.log('Logout successful');
                showToast('Logged out successfully', 'info');

                // Update UI
                updateUIBasedOnAuthState(null);

            } catch (error) {
                console.error('Logout error:', error);
                showToast(`Logout failed: ${error.message}`, 'error');
            }
        });
    }

    // User menu button toggles dropdown
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', () => {
            userDropdown.classList.toggle('visible');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('visible');
            }
        });
    }

    // Admin panel button
    if (adminPanelButton && adminModal) {
        adminPanelButton.addEventListener('click', () => {
            adminModal.classList.add('visible');
        });
    }

    // Close admin modal
    if (closeAdminModal && adminModal) {
        closeAdminModal.addEventListener('click', () => {
            adminModal.classList.remove('visible');
        });
    }


    // --- Initial UI Setup ---
    console.log("Setting up initial UI and checking for existing session...");

    // Check for existing session
    getSession().then(({ data, error }) => {
        if (error) {
            console.error('Error checking session:', error);
            updateUIBasedOnAuthState(null);
            return;
        }

        if (data && data.session) {
            console.log('Found existing session:', data.session);
            updateUIBasedOnAuthState(data.session.user);
        } else {
            console.log('No active session found');
            updateUIBasedOnAuthState(null);
        }
    });

    // Set up auth state change listener
    onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        updateUIBasedOnAuthState(session?.user || null);
    });

    // --- Helper function to show toast notifications ---
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to container
        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- Add loading animation to file input label ---
    function setFileInputLoading(isLoading) {
        const fileLabel = document.querySelector('.file-input-label');
        if (isLoading) {
            fileLabel.classList.add('loading');
        } else {
            fileLabel.classList.remove('loading');
        }
    }

    // --- Event Listener for File Input ---
    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return;
        }

        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
             console.error("Invalid file type. Please select a CSV file.");
             showToast("Invalid file type. Please select a CSV file.", 'error');
             csvFileInput.value = ''; // Reset file input
             return;
         }

        // Show loading animation
        setFileInputLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            const csvText = e.target.result;
            try {
                const parsedData = parseCSV(csvText);
                if (parsedData) {
                    console.log("CSV Parsed Data:", parsedData);
                    // Prepare data object including file info
                    const fileInfo = {
                        name: file.name,
                        uploadDate: new Date().toLocaleString(),
                        companyData: parsedData // The array of company objects
                    };
                    console.log("Uploading CSV data to Supabase:", fileInfo);

                    // Only allow upload if user is logged in and is joshua.cancel@kaseya.com
                    if (!currentUser) {
                        setFileInputLoading(false);
                        showToast("You must be logged in to upload CSV files", 'error');
                        return;
                    }

                    // Check specifically for joshua.cancel@kaseya.com
                    if (currentUser.email !== 'joshua.cancel@kaseya.com') {
                        setFileInputLoading(false);
                        showToast("Only joshua.cancel@kaseya.com can upload CSV files", 'error');
                        return;
                    }

                    // Upload to Supabase
                    uploadCSVData(fileInfo)
                        .then(() => {
                            setFileInputLoading(false);
                            console.log("SUCCESS: CSV data uploaded to Supabase.");
                            showToast("CSV data uploaded successfully!", 'success');

                            // Add success animation to file input
                            const fileLabel = document.querySelector('.file-input-label');
                            if (fileLabel) { // Check if element exists
                                fileLabel.classList.add('success');
                                setTimeout(() => fileLabel.classList.remove('success'), 2000);
                            }

                            // Refresh credentials from Supabase
                            getAllCompanyCredentials().then(credentials => {
                                console.log("Refreshed credentials:", credentials);
                                populateDropdown(credentials);

                                // Update file info
                                if (fileInfoDisplay) {
                                    fileInfoDisplay.textContent = `Loaded: ${file.name}`;
                                }

                                // Clear the file input
                                csvFileInput.value = '';
                            });
                        })
                        .catch(error => {
                            setFileInputLoading(false);
                            console.error("Error uploading CSV data to Supabase:", error);
                            showToast(`Error uploading data: ${error.message}`, 'error');
                            csvFileInput.value = ''; // Reset file input on error
                        });

                } else {
                     setFileInputLoading(false);
                     showToast("Failed to parse CSV. Check format and headers.", 'error');
                     csvFileInput.value = ''; // Reset file input on parse failure
                }
            } catch (error) {
                setFileInputLoading(false);
                console.error("Error processing CSV file:", error);
                showToast("Error processing CSV file.", 'error');
                csvFileInput.value = ''; // Reset file input on error
            }
        };

        reader.onerror = () => {
            setFileInputLoading(false);
            console.error("Error reading file:", reader.error);
            showToast("Error reading the selected file.", 'error');
            csvFileInput.value = ''; // Reset file input
        };

        reader.readAsText(file);
    });

    // --- Event Listener for Company Selection ---
    companySelect.addEventListener('change', (event) => {
        const selectedCompanyName = event.target.value;

        if (!selectedCompanyName) {
            // "-- Select Company --" chosen, clear fields
            uidInput.value = '';
            usernameInput.value = '';
            platformInput.value = '';
            return;
        }

        // Find the selected company in the cached data (using new cache)
        const selectedCompany = companyCredentialsCache.find(company => company["Account Name"] === selectedCompanyName);
        console.log("Company selected:", selectedCompanyName); // Log selected name

        if (selectedCompany) {
            console.log("Found company data in cache:", selectedCompany); // Log the whole object
            uidInput.value = selectedCompany.AccountUid || '';
            usernameInput.value = selectedCompany.username || '';
            // --- FIX: Use the correct property name 'instance' (lowercase) ---
            const instanceValue = selectedCompany.instance || ''; // Access with lowercase 'i'
            console.log("Accessing instance value:", instanceValue, "(from selectedCompany.instance)"); // Log the specific value
            platformInput.value = instanceValue;
        } else {
            // Should not happen if dropdown is populated correctly, but handle defensively
            console.warn("Selected company not found in cached data:", selectedCompanyName);
            uidInput.value = '';
            usernameInput.value = '';
            platformInput.value = '';
        }
    });

    // --- Button animation function ---
    function animateButton(button, state) {
        if (state === 'loading') {
            button.classList.add('loading');
            button.disabled = true;
        } else if (state === 'success') {
            button.classList.remove('loading');
            button.classList.add('success');
            setTimeout(() => {
                button.classList.remove('success');
                button.disabled = false;
            }, 2000);
        } else if (state === 'error') {
            button.classList.remove('loading');
            button.classList.add('error');
            setTimeout(() => {
                button.classList.remove('error');
                button.disabled = false;
            }, 2000);
        } else {
            button.classList.remove('loading', 'success', 'error');
            button.disabled = false;
        }
    }

    // --- Autofill Button Logic ---
    fillButton.addEventListener('click', () => {
        const selectedCompanyName = companySelect.value;

        if (!selectedCompanyName) {
            showToast("Please select a company from the dropdown first.", 'warning');
            companySelect.classList.add('highlight-error');
            setTimeout(() => companySelect.classList.remove('highlight-error'), 2000);
            console.log("Autofill attempt failed: No company selected.");
            return;
        }

        // Find the selected company in the cached data (using new cache)
        const selectedCompanyData = companyCredentialsCache.find(company => company["Account Name"] === selectedCompanyName);

        if (!selectedCompanyData) {
            showToast("Selected company data not found. Please reload the CSV.", 'error');
            console.error("Autofill failed: Could not find data for selected company:", selectedCompanyName);
            return;
        }

        // Start loading animation
        animateButton(fillButton, 'loading');

        // Find the active tab and send the message
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error("Error querying tabs:", chrome.runtime.lastError);
                showToast("Error finding active tab. Cannot autofill.", 'error');
                animateButton(fillButton, 'error');
                return;
            }
            if (tabs.length === 0) {
                console.error("No active tab found.");
                showToast("No active tab found. Cannot autofill.", 'error');
                animateButton(fillButton, 'error');
                return;
            }

            const activeTab = tabs[0];
            console.log(`Sending autofill message to tab ${activeTab.id} for company:`, selectedCompanyData);

            chrome.tabs.sendMessage(
                activeTab.id,
                {
                    action: "autofill",
                    data: {
                        AccountUid: selectedCompanyData.AccountUid,
                        username: selectedCompanyData.username,
                        instance: selectedCompanyData.instance // FIX: Use lowercase 'instance'
                    }
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        // Handle cases where the content script isn't injected or doesn't respond
                        console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                        showToast(`Could not connect to the page script. Ensure you are on the correct page.`, 'error');
                        animateButton(fillButton, 'error');
                    } else if (response && response.success) {
                        console.log("Autofill successful (reported by content script).");
                        showToast("Autofill successful!", 'success');
                        animateButton(fillButton, 'success');

                        // Add success highlight to form fields
                        const formInputs = document.querySelectorAll('.form-input');
                        formInputs.forEach(input => {
                            input.classList.add('highlight-success');
                            setTimeout(() => input.classList.remove('highlight-success'), 2000);
                        });
                    } else {
                        const errorMessage = response ? response.error : "Unknown error or no response from content script.";
                        console.error("Autofill failed (reported by content script):", errorMessage);
                        showToast(`Autofill failed: ${errorMessage}`, 'error');
                        animateButton(fillButton, 'error');
                    }
                }
            );
        });
    });
}); // End DOMContentLoaded