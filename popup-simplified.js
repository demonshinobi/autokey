document.addEventListener('DOMContentLoaded', function() {
    console.log('AutoKey extension loaded - simplified version');

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
    const adminPanelButton = document.getElementById('admin-panel-button');

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
    let companyCredentialsCache = [];

    // --- Helper Functions ---
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

    // --- Basic UI Setup ---
    // Make sure the main content is visible
    if (mainContent) {
        mainContent.style.display = 'block';
    }

    // Make sure the login button is visible
    if (loggedOutControls) {
        loggedOutControls.classList.remove('hidden');
    }

    // --- Event Listeners ---
    // Login button shows the login modal
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked');
            if (loginModal) {
                loginModal.classList.add('visible');
            }
        });
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
        loginForm.addEventListener('submit', (e) => {
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
            
            // For now, just show a message
            showToast(`Login attempt with ${email}`, 'info');
            
            // Close the modal
            if (loginModal) {
                loginModal.classList.remove('visible');
            }

            // Simulate successful login for joshua.cancel@kaseya.com
            if (email === 'joshua.cancel@kaseya.com') {
                // Update UI to show logged in state
                if (loggedInControls) loggedInControls.classList.remove('hidden');
                if (loggedOutControls) loggedOutControls.classList.add('hidden');
                
                // Update user info
                if (userInitial) userInitial.textContent = 'J';
                if (userEmail) userEmail.textContent = email;
                if (userRole) userRole.textContent = 'Admin';
                
                // Show admin panel button
                if (adminPanelButton) adminPanelButton.classList.remove('hidden');
                
                // Set current user
                currentUser = { email: email };
                isAdmin = true;
                
                showToast('Login successful!', 'success');
            } else {
                showToast('Only joshua.cancel@kaseya.com can log in as admin', 'error');
            }
        });
    }

    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
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
            
            // For now, just show a message
            showToast(`Account created for ${email}! Please log in.`, 'success');
            
            // Switch to login tab
            if (loginTab) {
                loginTab.click();
            }
        });
    }

    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Reset UI to logged out state
            if (loggedOutControls) loggedOutControls.classList.remove('hidden');
            if (loggedInControls) loggedInControls.classList.add('hidden');
            
            // Clear user info
            if (userInitial) userInitial.textContent = '';
            if (userEmail) userEmail.textContent = '';
            if (userRole) userRole.textContent = '';
            
            // Hide admin panel button
            if (adminPanelButton) adminPanelButton.classList.add('hidden');
            
            // Clear current user
            currentUser = null;
            isAdmin = false;
            
            showToast('Logged out successfully', 'info');
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

    // CSV file input
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

            // Check if user is logged in and is joshua.cancel@kaseya.com
            if (!currentUser) {
                showToast("You must be logged in to upload CSV files", 'error');
                return;
            }

            if (currentUser.email !== 'joshua.cancel@kaseya.com') {
                showToast("Only joshua.cancel@kaseya.com can upload CSV files", 'error');
                return;
            }

            // For now, just show a message
            showToast(`CSV file ${file.name} uploaded successfully`, 'success');
            
            // Update file info display
            if (fileInfoDisplay) {
                fileInfoDisplay.textContent = `Loaded: ${file.name}`;
            }
            
            // Add some dummy data to the dropdown
            const dummyData = [
                { "Account Name": "Company A", "username": "userA", "AccountUid": "A123", "instance": "instance1" },
                { "Account Name": "Company B", "username": "userB", "AccountUid": "B456", "instance": "instance2" },
                { "Account Name": "Company C", "username": "userC", "AccountUid": "C789", "instance": "instance3" }
            ];
            
            // Update cache and populate dropdown
            companyCredentialsCache = dummyData;
            
            // Clear existing options except the first one
            while (companySelect.options.length > 1) {
                companySelect.remove(1);
            }
            
            // Add new options
            dummyData.forEach(company => {
                const option = document.createElement('option');
                option.value = company["Account Name"];
                option.textContent = company["Account Name"];
                companySelect.appendChild(option);
            });
        });
    }

    // Company selection change
    companySelect.addEventListener('change', (event) => {
        const selectedCompanyName = event.target.value;
        
        if (!selectedCompanyName) {
            // Clear fields
            uidInput.value = '';
            usernameInput.value = '';
            platformInput.value = '';
            return;
        }
        
        // Find selected company in cache
        const selectedCompany = companyCredentialsCache.find(company => company["Account Name"] === selectedCompanyName);
        
        if (selectedCompany) {
            // Update fields
            uidInput.value = selectedCompany.AccountUid || '';
            usernameInput.value = selectedCompany.username || '';
            platformInput.value = selectedCompany.instance || '';
        } else {
            // Clear fields
            uidInput.value = '';
            usernameInput.value = '';
            platformInput.value = '';
        }
    });

    // Autofill button
    fillButton.addEventListener('click', () => {
        const selectedCompanyName = companySelect.value;
        
        if (!selectedCompanyName) {
            showToast("Please select a company from the dropdown first.", 'warning');
            return;
        }
        
        // Find selected company in cache
        const selectedCompany = companyCredentialsCache.find(company => company["Account Name"] === selectedCompanyName);
        
        if (!selectedCompany) {
            showToast("Selected company data not found.", 'error');
            return;
        }
        
        // Show success message
        showToast("Autofill successful!", 'success');
        
        // Add success highlight to form fields
        const formInputs = document.querySelectorAll('.form-input');
        formInputs.forEach(input => {
            input.classList.add('highlight-success');
            setTimeout(() => input.classList.remove('highlight-success'), 2000);
        });
    });

    // Show a welcome message
    showToast('AutoKey extension loaded successfully', 'success');
});
