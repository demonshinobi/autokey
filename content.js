console.log('[AutoKey Content Script] Loaded and running.');

// Function to find the platform option value based on its text content (URL)
function findPlatformValue(selectElement, targetUrl) {
    console.log(`[AutoKey Content Script] Searching for platform URL: ${targetUrl}`);
    if (!selectElement || !targetUrl) return null;

    for (let i = 0; i < selectElement.options.length; i++) {
        const option = selectElement.options[i];
        console.log(`[AutoKey Content Script] Comparing with option text: ${option.textContent}`);
        // Trim whitespace and compare
        if (option.textContent && option.textContent.trim() === targetUrl.trim()) { // Fixed: && instead of &amp;
            console.log(`[AutoKey Content Script] Match found! Option value: ${option.value}`);
            return option.value;
        }
    }
    console.log(`[AutoKey Content Script] No matching platform option found for URL: ${targetUrl}`);
    return null;
}

console.log('[AutoKey Content Script] Setting up message listener...');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[AutoKey Content Script] Message received:', message);

    if (message.action === "autofill" && message.data) { // Fixed: && instead of &amp;
        const data = message.data;
        console.log('[AutoKey Content Script] Autofill action triggered with data:', data);

        try {
            const accountUidInput = document.getElementById('account');
            const usernameInput = document.getElementById('username');
            const platformSelect = document.getElementById('instance');

            let success = true;
            let errors = [];

            if (accountUidInput) {
                accountUidInput.value = data.AccountUid || '';
                console.log(`[AutoKey Content Script] Set Account UID: ${accountUidInput.value}`);
            } else {
                console.error('[AutoKey Content Script] Account UID input (#account) not found.');
                errors.push('Account UID field not found');
                success = false;
            }

            if (usernameInput) {
                usernameInput.value = data.username || '';
                console.log(`[AutoKey Content Script] Set Username: ${usernameInput.value}`);
            } else {
                console.error('[AutoKey Content Script] Username input (#username) not found.');
                errors.push('Username field not found');
                success = false;
            }

            if (platformSelect) {
                const platformValue = findPlatformValue(platformSelect, data.instance);
                if (platformValue !== null) {
                    platformSelect.value = platformValue;
                    console.log(`[AutoKey Content Script] Set Platform dropdown value to: ${platformValue}`);
                    // Optional: Dispatch change event if needed by the page
                    // platformSelect.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    console.error(`[AutoKey Content Script] Could not find matching option for instance URL: ${data.instance}`);
                    errors.push('Platform option not found');
                    // Decide if this is a failure or just a warning
                    // success = false;
                }
            } else {
                console.error('[AutoKey Content Script] Platform select (#instance) not found.');
                errors.push('Platform field not found');
                success = false;
            }

            sendResponse({ success: success, errors: errors });

        } catch (error) {
            console.error('[AutoKey Content Script] Error during autofill:', error);
            sendResponse({ success: false, error: error.message });
        }
        // Keep the message channel open for the asynchronous response
        return true;
    } else {
         console.log('[AutoKey Content Script] Received message is not for autofill or missing data.');
         // Send a response for other messages if needed, or just let it close
         // sendResponse({ success: false, error: 'Invalid message format' });
    }
});

console.log('[AutoKey Content Script] Message listener set up.');