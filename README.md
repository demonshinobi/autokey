# AutoKey - Shadow Access Autofill Chrome/Edge Extension

This extension helps autofill the Autotask Endpoint Management (AEM) shadow access login page using details from a CSV file.

## Features

*   Upload a CSV file containing account details (Account Name, username, AccountUid, instance URL).
*   Select a company from a dropdown populated by the CSV.
*   Displays the corresponding UID, Username, and Platform (Instance URL).
*   Autofills the AEM shadow login page (`https://www.centrastage.net/csm/login/internal`) with the selected company's details upon clicking "Autofill".
*   Secure authentication with Supabase.
*   Admin-only CSV upload functionality (restricted to joshua.cancel@kaseya.com).

## Setup Instructions

### For Microsoft Edge

1.  **Download the Extension Files:**
    *   Go to the GitHub repository: `https://github.com/demonshinobi/autokey`
    *   Click the green "<> Code" button.
    *   Select "Download ZIP".
    *   Extract the downloaded ZIP file to a permanent location on your computer (e.g., `C:\Tools\autokey-extension`). Remember where you put it!

2.  **Load the Extension in Edge:**
    *   Open Microsoft Edge.
    *   Navigate to the Extensions page by typing `edge://extensions/` in the address bar and pressing Enter.
    *   Enable "Developer mode" using the toggle switch (usually in the bottom-left corner).
    *   Click the "Load unpacked" button that appears.
    *   In the file browser window that opens, navigate to and select the folder where you extracted the extension files (e.g., the `autokey-extension` folder itself, *not* the ZIP file).
    *   Click "Select Folder".

3.  **Verify Installation:**
    *   The "AutoKey - Shadow Access Autofill" extension should now appear in your list of extensions.
    *   You should see its icon (the AutoKey logo) in the Edge toolbar (you might need to click the puzzle piece icon to pin it).

### For Google Chrome

1.  **Download the Extension Files:**
    *   Go to the GitHub repository: `https://github.com/demonshinobi/autokey`
    *   Click the green "<> Code" button.
    *   Select "Download ZIP".
    *   Extract the downloaded ZIP file to a permanent location on your computer (e.g., `C:\Tools\autokey-extension`). Remember where you put it!

2.  **Load the Extension in Chrome:**
    *   Open Google Chrome.
    *   Navigate to the Extensions page by typing `chrome://extensions/` in the address bar and pressing Enter.
    *   Enable "Developer mode" using the toggle switch in the top-right corner.
    *   Click the "Load unpacked" button that appears.
    *   In the file browser window that opens, navigate to and select the folder where you extracted the extension files (e.g., the `autokey-extension` folder itself, *not* the ZIP file).
    *   Click "Select Folder".

3.  **Verify Installation:**
    *   The "AutoKey - Shadow Access Autofill" extension should now appear in your list of extensions.
    *   You should see its icon (the AutoKey logo) in the Chrome toolbar (you might need to click the puzzle piece icon to pin it).

## Usage

1.  **Authentication:**
    *   Click the AutoKey extension icon in your Edge/Chrome toolbar to open the popup.
    *   Click the "Login" button in the top right corner.
    *   Enter your Supabase credentials (email and password).
    *   If you don't have an account, you can sign up by clicking the "Sign Up" tab.

2.  **Prepare CSV (Admin Only - joshua.cancel@kaseya.com):**
    *   Create a CSV file with the following exact headers in the first row:
        `Account Name,username,AccountUid,instance`
    *   Add your company access details in the subsequent rows. Ensure the `instance` column contains the correct platform URL (e.g., `https://vidal.centrastage.net/csm/`).
    *   Save the file (e.g., `ShadowData.csv`).

3.  **Load CSV into Extension (Admin Only):**
    *   After logging in as an admin, you'll see the CSV upload section.
    *   Click the "Upload CSV" button.
    *   Select the CSV file you prepared.
    *   The popup should display "Loaded: [your_filename] ([date/time])".
    *   The "Company" dropdown should now be populated with the names from your CSV.

4.  **Autofill:**
    *   Navigate to the AEM shadow login page: `https://www.centrastage.net/csm/login/internal`
    *   Open the AutoKey extension popup again.
    *   Select the desired company from the dropdown. The UID, Username, and Platform fields in the popup will update.
    *   Click the "Autofill" button.
    *   The corresponding fields on the login page should be filled automatically.

## Troubleshooting

*   **Autofill Not Working:**
    *   Ensure you are on the correct login page (`https://www.centrastage.net/csm/login/internal`).
    *   Reload the extension on the `edge://extensions/` or `chrome://extensions/` page and refresh the login page.
    *   Make sure the CSV headers exactly match `Account Name,username,AccountUid,instance`.
    *   Try testing in an InPrivate/Incognito window with only this extension enabled to rule out conflicts.
*   **Data Not Saving:**
    *   Ensure the extension has `storage` permission (it should by default).
    *   Check for browser errors in the developer console (F12).
*   **Login Issues:**
    *   If you can't log in, make sure you're using the correct credentials.
    *   If you don't have an account, sign up using the "Sign Up" tab.
    *   Contact joshua.cancel@kaseya.com if you need access.
*   **CSV Upload Not Visible:**
    *   The CSV upload functionality is only available to admin users (joshua.cancel@kaseya.com).
    *   Regular users will need to use the CSV data uploaded by an admin.

## Security Features

* Authentication is handled securely through Supabase
* CSV upload functionality is restricted to admin users only
* Data is stored locally in the browser and not sent to external servers (except for authentication)
* Complies with Chrome's Content Security Policy (CSP) requirements