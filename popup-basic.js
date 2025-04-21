// AutoKey extension with Supabase authentication
console.log('AutoKey extension loading - with Supabase auth');

// Make sure we have access to the Supabase client
if (typeof supabase === 'undefined') {
    console.error('Supabase client is not defined! Authentication will not work.');
} else {
    console.log('Supabase client is available in popup-basic.js');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');

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

    // --- State Variables ---
    let currentUser = null;
    let isAdmin = false;

    // Make sure the main content is visible
    if (mainContent) {
        mainContent.style.display = 'block';
        console.log('Main content should be visible');
    } else {
        console.error('Main content element not found');
    }

    // Make sure the login button is visible
    if (loggedOutControls) {
        loggedOutControls.classList.remove('hidden');
        console.log('Login button should be visible');
    } else {
        console.error('Logged out controls not found');
    }

    // --- Helper Functions ---
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

            // As a fallback, check the profiles table
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', userData.user.id)
                .single();

            if (error || !profileData) return false;

            return profileData.is_admin === true;
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
        }
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
