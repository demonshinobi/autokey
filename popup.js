document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFileInput');
    const companySelect = document.getElementById('companySelect');
    const uidInput = document.getElementById('uidInput');
    const usernameInput = document.getElementById('usernameInput');
    const platformInput = document.getElementById('platformInput');
    const fillButton = document.getElementById('fillButton'); // Get reference to the button
    let companyDataCache = []; // Cache loaded data

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


    // --- Load Data on Popup Open ---
    console.log("Attempting to load data from chrome.storage.local...");
    chrome.storage.local.get(['loadedCsvData'], (result) => { // Get the new object
        console.log("chrome.storage.local.get callback executed.");
        if (chrome.runtime.lastError) {
            console.error("Error loading data from storage:", chrome.runtime.lastError);
            populateDropdown([]); // Clear dropdown
            updateFileInfoDisplay(null, null); // Clear display
        } else if (result && result.loadedCsvData) {
            // Check if the new object exists
            const fileInfo = result.loadedCsvData;
            console.log("SUCCESS: Loaded CSV data object from storage:", fileInfo);
            console.log("Calling populateDropdown with extracted company data...");
            populateDropdown(fileInfo.companyData || []); // Pass the company data array
            console.log("Calling updateFileInfoDisplay with loaded file info...");
            updateFileInfoDisplay(fileInfo.name, fileInfo.uploadDate); // Update the display
        } else {
            console.log("No loadedCsvData found in storage. Result:", result);
            console.log("Calling populateDropdown with empty array...");
            populateDropdown([]); // Ensure dropdown is cleared
            console.log("Calling updateFileInfoDisplay with null values...");
            updateFileInfoDisplay(null, null); // Clear display
        }
    });

    // --- Event Listener for File Input ---
    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return;
        }

        if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
             console.error("Invalid file type. Please select a CSV file.");
             alert("Invalid file type. Please select a CSV file."); // User feedback
             csvFileInput.value = ''; // Reset file input
             return;
         }


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
                    console.log("Attempting to save data object to chrome.storage.local:", fileInfo);

                    // Store the combined object in chrome.storage.local
                    chrome.storage.local.set({ loadedCsvData: fileInfo }, () => {
                        console.log("chrome.storage.local.set callback executed.");
                        if (chrome.runtime.lastError) {
                            console.error("Error saving data to storage:", chrome.runtime.lastError);
                            alert("Error saving data. Please try again.");
                        } else {
                            console.log("SUCCESS: CSV data object saved to storage.");
                            console.log("Calling populateDropdown with newly saved data...");
                            populateDropdown(fileInfo.companyData); // Populate dropdown with new data
                            console.log("Calling updateFileInfoDisplay with new file info...");
                            updateFileInfoDisplay(fileInfo.name, fileInfo.uploadDate); // Update display immediately
                            alert("CSV data loaded successfully!"); // User feedback
                        }
                    });
                } else {
                     alert("Failed to parse CSV. Check console for details and ensure the file format is correct (including headers: Account Name, username, AccountUid, Instance).");
                     csvFileInput.value = ''; // Reset file input on parse failure
                }
            } catch (error) {
                console.error("Error processing CSV file:", error);
                alert("An error occurred while processing the CSV file. Check console for details.");
                csvFileInput.value = ''; // Reset file input on error
            }
        };

        reader.onerror = (e) => {
            console.error("Error reading file:", reader.error);
            alert("Error reading the selected file.");
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

        // Find the selected company in the cached data
        const selectedCompany = companyDataCache.find(company => company["Account Name"] === selectedCompanyName);
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

    // --- Autofill Button Logic ---
    fillButton.addEventListener('click', () => {
        const selectedCompanyName = companySelect.value;

        if (!selectedCompanyName) {
            alert("Please select a company from the dropdown first.");
            console.log("Autofill attempt failed: No company selected.");
            return;
        }

        // Find the selected company in the cached data
        const selectedCompanyData = companyDataCache.find(company => company["Account Name"] === selectedCompanyName);

        if (!selectedCompanyData) {
            alert("Error: Selected company data not found. Please try reloading the CSV.");
            console.error("Autofill failed: Could not find data for selected company:", selectedCompanyName);
            return;
        }

        // Find the active tab and send the message
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                console.error("Error querying tabs:", chrome.runtime.lastError);
                alert("Error finding active tab. Cannot autofill.");
                return;
            }
            if (tabs.length === 0) {
                console.error("No active tab found.");
                alert("No active tab found. Cannot autofill.");
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
                        Instance: selectedCompanyData.Instance
                    }
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        // Handle cases where the content script isn't injected or doesn't respond
                        console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                        alert(`Could not connect to the page script. Ensure you are on the correct Autotask page and refresh the extension/page if necessary. Error: ${chrome.runtime.lastError.message}`);
                    } else if (response && response.success) {
                        console.log("Autofill successful (reported by content script).");
                        // Optionally provide user feedback like closing the popup or a small success message
                        // window.close(); // Example: Close popup on success
                    } else {
                        const errorMessage = response ? response.error : "Unknown error or no response from content script.";
                        console.error("Autofill failed (reported by content script):", errorMessage);
                        alert(`Autofill failed: ${errorMessage}`);
                    }
                }
            );
        });
    });
}); // End DOMContentLoaded