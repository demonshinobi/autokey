// Initialize Supabase client
const supabaseUrl = 'https://urhehutiqaazkfccaenf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyaGVodXRpcWFhemtmY2NhZW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDg3MzksImV4cCI6MjA2MDc4NDczOX0.TxmtQDJ-dtGREZNZiLh8RmjlmOurMpKucooEukuDSzI';

// The UMD build exposes a global "supabase" object
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized:', supabase);

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');

    // Make sure body is visible immediately
    document.body.classList.add('loaded');

    // Make form groups visible immediately
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.add('visible');
    });

    // Make action button visible immediately
    const actionButton = document.querySelector('.action-button');
    if (actionButton) actionButton.classList.add('visible');

    // --- UI Elements ---
    const loginButton = document.getElementById('login-button');
    const loggedOutControls = document.getElementById('logged-out-controls');
    const loggedInControls = document.getElementById('logged-in-controls');
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    const userInitial = document.getElementById('user-initial');
    const userEmail = document.getElementById('user-email');
    const userRole = document.getElementById('user-role');
    const logoutButton = document.getElementById('logout-button');

    // Login modal elements
    const loginModal = document.getElementById('login-modal');
    const closeModal = document.getElementById('close-modal');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

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
    let companyDataCache = []; // Cache for company data

    // --- Helper Functions ---
    // Debug function to log element states
    function debugElement(elementId) {
        const element = document.getElementById(elementId);
        console.log(`Debug ${elementId}:`, {
            exists: !!element,
            display: element ? getComputedStyle(element).display : 'N/A',
            visibility: element ? getComputedStyle(element).visibility : 'N/A',
            opacity: element ? getComputedStyle(element).opacity : 'N/A',
            classList: element ? Array.from(element.classList) : 'N/A'
        });
        return element;
    }

    // Toast notification function
    function showToast(message, type = 'info') {
        console.log(`Showing ${type} toast:`, message);

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

    // Check if user is admin
    async function isUserAdmin() {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return false;

            // Check if the user is joshua.cancel@kaseya.com (hardcoded admin)
            if (userData.user.email === 'joshua.cancel@kaseya.com') {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
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

            // Show/hide CSV upload section based on email
            const csvUploadSection = document.getElementById('csv-upload-section');
            if (csvUploadSection) {
                if (user.email === 'joshua.cancel@kaseya.com') {
                    csvUploadSection.style.display = 'block';
                    console.log('CSV upload visible - User is joshua.cancel@kaseya.com');
                } else {
                    csvUploadSection.style.display = 'none';
                    console.log('CSV upload hidden - User is not joshua.cancel@kaseya.com');
                }
            } else {
                console.error('CSV upload section not found');
            }

            // Load company data from Supabase when user logs in
            loadCompanyData();

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

            // Hide CSV upload section
            const csvUploadSection = document.getElementById('csv-upload-section');
            if (csvUploadSection) {
                csvUploadSection.style.display = 'none';
                console.log('CSV upload hidden - User is logged out');
            } else {
                console.error('CSV upload section not found');
            }

            // Clear dropdown when user logs out
            populateDropdown([]);
            updateFileInfoDisplay(null, null);
        }
    }

    // --- CSV Parsing Function ---
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

        // Define expected headers
        const expectedHeaders = ["Account Name", "username", "AccountUid", "instance"];
        console.log("Expected Headers:", expectedHeaders);

        // Find the index of each expected header in the file headers (case-insensitive)
        const headerIndexMap = {};
        let missingHeaders = [];
        expectedHeaders.forEach(expectedHeader => {
            const foundIndex = fileHeaders.findIndex(fileHeader =>
                fileHeader.toLowerCase() === expectedHeader.toLowerCase());
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
            const values = lines[i].split(',').map(value => {
                // Trim whitespace and remove surrounding quotes if present
                let trimmedValue = value.trim();
                if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
                    trimmedValue = trimmedValue.substring(1, trimmedValue.length - 1);
                }
                return trimmedValue;
            });

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

    // --- Populate Dropdown Function ---
    function populateDropdown(companyData) {
        console.log('[populateDropdown] Received companyData:', JSON.stringify(companyData)); // Log received data
        console.log('[populateDropdown] companySelect element:', companySelect); // Log element reference

        companyDataCache = companyData || []; // Update cache

        // Clear existing options except the first one ("-- Select Company --")
        console.log(`[populateDropdown] Before clearing: ${companySelect.options.length} options`);
        while (companySelect.options.length > 1) {
            companySelect.remove(1);
        }
        console.log(`[populateDropdown] After clearing: ${companySelect.options.length} options`);

        if (companyDataCache && companyDataCache.length > 0) {
            companyDataCache.forEach(company => {
                // Handle both formats: Supabase format and local storage format
                const companyName = company['Account Name'] || company.account_name;
                const companyId = company.id || company['Account Name'] || company.account_name;

                console.log(`[populateDropdown] Processing company: ${companyName} (ID: ${companyId})`);

                const option = document.createElement('option');
                option.value = companyId; // Use ID as value for better uniqueness
                option.textContent = companyName;
                console.log(`[populateDropdown] Appending option: value=${option.value}, text=${option.textContent}`);
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

    // --- Add loading animation to file input label ---
    function setFileInputLoading(isLoading) {
        const fileLabel = document.querySelector('.file-input-label');
        if (isLoading) {
            fileLabel.classList.add('loading');
        } else {
            fileLabel.classList.remove('loading');
        }
    }

    // --- Event Listeners ---
    // Login button shows the login modal
    console.log('Setting up login button click handler');

    // Add click event to login button
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            console.log('Login button clicked');
            const modal = document.getElementById('login-modal');
            if (modal) {
                console.log('Found login modal, showing it');
                modal.style.display = 'flex';
                modal.style.opacity = '1';
                modal.style.pointerEvents = 'auto';
                modal.classList.add('visible');
            } else {
                console.error('Login modal element not found');
            }
        });
    } else {
        console.error('Login button element not found');
    }

    // Close modal button
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            console.log('Close modal button clicked');
            const modal = document.getElementById('login-modal');
            if (modal) {
                console.log('Removing visible class from login modal');
                modal.classList.remove('visible');
                // Set a timeout to hide the modal after the transition
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300); // Match the transition duration
            } else {
                console.error('Login modal element not found');
            }
        });
    } else {
        console.error('Close modal button element not found');
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
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                console.log('Login successful:', data);
                showToast('Login successful!', 'success');

                // Close the modal
                const modal = document.getElementById('login-modal');
                if (modal) {
                    modal.classList.remove('visible');
                    // Set a timeout to hide the modal after the transition
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300); // Match the transition duration
                } else {
                    console.error('Login modal element not found');
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
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                });

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
                const { error } = await supabase.auth.signOut();
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

    // --- CSV File Input Event Listener ---
    if (csvFileInput) {
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

            reader.onload = async (e) => {
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

                        try {
                            // First, store the file metadata in Supabase
                            const { data: fileData, error: fileError } = await supabase
                                .from('csv_files')
                                .insert({
                                    name: fileInfo.name,
                                    upload_date: fileInfo.uploadDate,
                                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                                })
                                .select()
                                .single();

                            if (fileError) throw fileError;

                            // Then, store each company record with a reference to the file
                            const companyRecords = fileInfo.companyData.map(company => ({
                                file_id: fileData.id,
                                account_name: company['Account Name'],
                                username: company.username,
                                account_uid: company.AccountUid,
                                instance: company.instance
                            }));

                            const { data: companyData, error: companyError } = await supabase
                                .from('company_credentials')
                                .insert(companyRecords);

                            if (companyError) throw companyError;

                            // Also store in local storage for faster access
                            chrome.storage.local.set({ loadedCsvData: fileInfo });

                            // Hide loading animation
                            setFileInputLoading(false);

                            console.log("SUCCESS: CSV data saved to Supabase and local storage.");
                            console.log("Calling populateDropdown with newly saved data...");
                            populateDropdown(fileInfo.companyData); // Populate dropdown with new data
                            console.log("Calling updateFileInfoDisplay with new file info...");
                            updateFileInfoDisplay(fileInfo.name, fileInfo.uploadDate); // Update display immediately

                            // Add success animation to file input
                            const fileLabel = document.querySelector('.file-input-label');
                            fileLabel.classList.add('success');
                            setTimeout(() => fileLabel.classList.remove('success'), 2000);

                            showToast("CSV data uploaded successfully!", 'success');

                            // Animate form fields appearing
                            const formGroups = document.querySelectorAll('.form-group');
                            formGroups.forEach((group, index) => {
                                setTimeout(() => {
                                    group.classList.add('visible');
                                }, 100 + (index * 100));
                            });
                        } catch (dbError) {
                            console.error("Error saving to Supabase:", dbError);
                            setFileInputLoading(false);
                            showToast("Error saving data to database. Please try again.", 'error');
                        }
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
    }

    // --- Company Selection Event Listener ---
    if (companySelect) {
        companySelect.addEventListener('change', (event) => {
            const selectedCompanyId = event.target.value;

            if (!selectedCompanyId) {
                // "-- Select Company --" chosen, clear fields
                uidInput.value = '';
                usernameInput.value = '';
                platformInput.value = '';
                return;
            }

            // Find the selected company in the cached data
            // Use == for potential type coercion (value might be string, id might be number)
            const selectedCompany = companyDataCache.find(company =>
                (company.id && company.id == selectedCompanyId) ||
                (company['Account Name'] === selectedCompanyId) ||
                (company.account_name === selectedCompanyId)
            );

            console.log("Company selected ID:", selectedCompanyId); // Log selected ID

            if (selectedCompany) {
                console.log("Found company data in cache:", selectedCompany); // Log the whole object

                // Handle both formats: Supabase format and local storage format
                uidInput.value = selectedCompany.AccountUid || selectedCompany.account_uid || '';
                usernameInput.value = selectedCompany.username || '';
                platformInput.value = selectedCompany.instance || '';

                console.log(`Populated fields: UID=${uidInput.value}, User=${usernameInput.value}, Instance=${platformInput.value}`);
            } else {
                // Should not happen if dropdown is populated correctly, but handle defensively
                console.warn("Selected company not found in cached data for ID:", selectedCompanyId);
                uidInput.value = '';
                usernameInput.value = '';
                platformInput.value = '';
            }
        });
    }

    // --- Autofill Button Event Listener ---
    if (fillButton) {
        fillButton.addEventListener('click', () => {
            const selectedCompanyId = companySelect.value;

            if (!selectedCompanyId) {
                showToast("Please select a company from the dropdown first.", 'warning');
                companySelect.classList.add('highlight-error');
                setTimeout(() => companySelect.classList.remove('highlight-error'), 2000);
                console.log("Autofill attempt failed: No company selected.");
                return;
            }

            // Find the selected company in the cached data
            // Use == for potential type coercion (value might be string, id might be number)
            const selectedCompanyData = companyDataCache.find(company =>
                (company.id && company.id == selectedCompanyId) ||
                (company['Account Name'] === selectedCompanyId) ||
                (company.account_name === selectedCompanyId)
            );

            if (!selectedCompanyData) {
                showToast("Selected company data not found. Please refresh or check data.", 'error');
                console.error("Autofill failed: Could not find data for selected company ID:", selectedCompanyId);
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

                // Handle both formats: Supabase format and local storage format
                const autofillData = {
                    AccountUid: selectedCompanyData.AccountUid || selectedCompanyData.account_uid || '',
                    username: selectedCompanyData.username || '',
                    instance: selectedCompanyData.instance || ''
                };

                chrome.tabs.sendMessage(
                    activeTab.id,
                    {
                        action: "autofill",
                        data: autofillData
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
    }

    // --- Load Data Function ---
    async function loadCompanyData() {
        console.log("Loading company data from Supabase...");
        try {
            // First try to get data from Supabase
            const { data: companyCredentials, error } = await supabase
                .from('company_credentials')
                .select(`
                    id,
                    account_name,
                    username,
                    account_uid,
                    instance,
                    csv_files (name, upload_date)
                `)
                .order('account_name', { ascending: true });

            if (error) {
                throw error;
            }

            if (companyCredentials && companyCredentials.length > 0) {
                console.log("SUCCESS: Loaded company data from Supabase:", companyCredentials);

                // Convert Supabase format to the format expected by populateDropdown
                const formattedData = companyCredentials.map(company => ({
                    "Account Name": company.account_name,
                    "username": company.username,
                    "AccountUid": company.account_uid,
                    "instance": company.instance,
                    "id": company.id
                }));

                // Populate dropdown with data from Supabase
                populateDropdown(formattedData);

                // Get the most recent file info for display
                if (companyCredentials[0].csv_files) {
                    updateFileInfoDisplay(
                        companyCredentials[0].csv_files.name,
                        companyCredentials[0].csv_files.upload_date
                    );
                }

                return;
            }

            // If no data in Supabase, fall back to local storage
            console.log("No data found in Supabase, checking local storage...");
            chrome.storage.local.get(['loadedCsvData'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Error loading data from storage:", chrome.runtime.lastError);
                    populateDropdown([]); // Clear dropdown
                    updateFileInfoDisplay(null, null); // Clear display
                } else if (result && result.loadedCsvData) {
                    // Check if the data object exists
                    const fileInfo = result.loadedCsvData;
                    console.log("SUCCESS: Loaded CSV data object from storage:", fileInfo);
                    populateDropdown(fileInfo.companyData || []); // Pass the company data array
                    updateFileInfoDisplay(fileInfo.name, fileInfo.uploadDate); // Update the display
                } else {
                    console.log("No data found in local storage either.");
                    populateDropdown([]); // Ensure dropdown is cleared
                    updateFileInfoDisplay(null, null); // Clear display
                }
            });

        } catch (error) {
            console.error("Error loading data from Supabase:", error);
            showToast("Error loading company data. Please try again.", 'error');

            // Fall back to local storage
            chrome.storage.local.get(['loadedCsvData'], (result) => {
                if (result && result.loadedCsvData) {
                    const fileInfo = result.loadedCsvData;
                    populateDropdown(fileInfo.companyData || []);
                    updateFileInfoDisplay(fileInfo.name, fileInfo.uploadDate);
                } else {
                    populateDropdown([]);
                    updateFileInfoDisplay(null, null);
                }
            });
        }
    }

    // Load data on popup open
    loadCompanyData();

    // --- Initial Auth Check ---
    // Check for existing session
    supabase.auth.getSession().then(({ data, error }) => {
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
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        updateUIBasedOnAuthState(session?.user || null);
    });

    // Show a welcome message
    showToast('AutoKey extension loaded successfully', 'success');
});
