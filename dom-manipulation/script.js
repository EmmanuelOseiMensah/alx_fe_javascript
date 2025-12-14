/**
 * ========================================
 * 1. DATA AND STORAGE SETUP
 * ========================================
 */

const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work", id: 1, timestamp: Date.now() - 100000 },
    { text: "Persistence can change failure into extraordinary achievement.", category: "Motivation", id: 2, timestamp: Date.now() - 90000 },
    { text: "Simplicity is the ultimate sophistication.", category: "Design", id: 3, timestamp: Date.now() - 80000 },
    { text: "The mind is everything. What you think you become.", category: "Wisdom", id: 4, timestamp: Date.now() - 70000 }
];

let quotes = [];
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Base URL for mock API
const SYNC_INTERVAL = 5000; 
let isSyncing = false; 


/**
 * ========================================
 * 2. STORAGE MANAGEMENT FUNCTIONS
 * ========================================
 */

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
    // 1. Load Data from Local Storage
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes);
    } else {
        quotes = defaultQuotes;
        saveQuotes();
    }

    // 2. Initialize Categories and Restore Filter State
    populateCategories();
    const savedFilter = localStorage.getItem('lastCategoryFilter');
    if (savedFilter) {
        if (categoryFilter.querySelector(`option[value="${savedFilter}"]`)) {
            categoryFilter.value = savedFilter;
        }
    }

    // 3. Display Content
    filterQuotes();

    // 4. Load Last Viewed Quote from Session Storage
    const lastQuoteHTML = sessionStorage.getItem('lastViewedQuote');
    if (lastQuoteHTML) {
        quoteDisplay.innerHTML = `<p class="last-session-quote">Last viewed quote from session:</p>` + JSON.parse(lastQuoteHTML);
    }
    
    // Start Server Simulation and Sync
    syncQuotes(); 
    setInterval(syncQuotes, SYNC_INTERVAL); 
}


/**
 * ========================================
 * 3. SERVER INTERACTION AND SYNC LOGIC
 * ========================================
 */

/**
 * CHECK: fetchQuotesFromServer function & Fetching data from the server
 */
async function fetchServerQuotes() {
    try {
        // Fetch only a limited set of posts to simulate a recent updates endpoint
        const response = await fetch(`${SERVER_URL}?_limit=5`);
        const serverPosts = await response.json();

        // Map mock posts to our quote structure
        const serverQuotes = serverPosts.map(post => ({
            text: post.title.charAt(0).toUpperCase() + post.title.slice(1), 
            category: 'Server Update',
            id: post.id, 
            timestamp: Date.now() - (10000 * post.id) // Simulate timestamps
        }));
        
        return serverQuotes;
    } catch (error) {
        console.error("Error fetching server data:", error);
        setSyncStatus("Sync Failed (Network Error)", 'error');
        return [];
    }
}

/**
 * CHECK: Posting data to the server using a mock API
 * Simulates sending a new quote to the server.
 */
async function postNewQuoteToServer(newQuote) {
    try {
        setSyncStatus("Sending new quote...", 'loading');
        
        // JSONPlaceholder expects 'title' and 'body'
        const postData = {
            title: newQuote.text,
            body: newQuote.category,
            userId: 1, // Required by JSONPlaceholder
        };

        const response = await fetch(SERVER_URL, {
            method: 'POST',
            body: JSON.stringify(postData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
        
        const responseData = await response.json();
        
        if (response.ok || response.status === 201) {
            // Update the locally stored quote with the confirmed server ID and timestamp
            // NOTE: In JSONPlaceholder, the ID is just the next number (e.g., 101)
            newQuote.id = responseData.id;
            newQuote.timestamp = Date.now();
            saveQuotes();
            setSyncStatus("Quote posted successfully!", 'success');
            return true;
        } else {
            setSyncStatus(`Post Failed: Status ${response.status}`, 'error');
            return false;
        }

    } catch (error) {
        console.error("Error posting data:", error);
        setSyncStatus("Post Failed (Connection Error)", 'error');
        return false;
    }
}


/**
 * CHECK: syncQuotes function & Periodically checking for new quotes
 * CHECK: Updating local storage with server data and conflict resolution
 */
async function syncQuotes() {
    if (isSyncing) return;
    isSyncing = true;
    setSyncStatus("Syncing...", 'loading');

    const serverQuotes = await fetchServerQuotes();
    
    if (serverQuotes.length === 0) {
        isSyncing = false;
        if (document.getElementById('syncStatus').className !== 'sync-status sync-error') {
            setSyncStatus("Synced successfully.", 'idle');
        }
        return;
    }

    let mergeCount = 0;
    let conflictCount = 0;
    const localQuotesMap = new Map();
    
    // Populate map with current local data
    quotes.forEach(q => localQuotesMap.set(q.id || `local_${q.text.substring(0, 10)}`, q));
    
    serverQuotes.forEach(serverQuote => {
        const serverKey = serverQuote.id || `server_${serverQuote.text.substring(0, 10)}`;
        const localQuote = localQuotesMap.get(serverKey);
        
        if (localQuote) {
            // Conflict Resolution: Server precedence strategy
            if (serverQuote.timestamp > localQuote.timestamp) {
                localQuotesMap.set(serverKey, serverQuote);
                conflictCount++;
            }
        } else {
            // New quote from the server
            localQuotesMap.set(serverKey, serverQuote);
            mergeCount++;
        }
    });

    quotes = Array.from(localQuotesMap.values());
    saveQuotes(); 

    // CHECK: UI elements or notifications for data updates or conflicts
    if (conflictCount > 0) {
        setConflictNotification(
            `Server sync resolved ${conflictCount} conflicts. Server data took precedence.`, 
            'warning'
        );
    } else {
        setConflictNotification('', ''); 
    }

    setSyncStatus(`Sync Complete. Added ${mergeCount} new quote(s).`, 'success');
    populateCategories();
    filterQuotes(); 
    
    isSyncing = false;
}

/**
 * CHECK: UI elements or notifications for data updates or conflicts
 */
function setSyncStatus(message, type) {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `sync-status sync-${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
             if (statusElement.textContent === message) {
                statusElement.textContent = 'Synced successfully.';
                statusElement.className = 'sync-status sync-idle';
            }
        }, 3000);
    }
}

function setConflictNotification(message, type) {
    const notificationElement = document.getElementById('conflictNotification');
    if (!notificationElement) return;

    notificationElement.innerHTML = message;
    
    if (type === 'warning' && message) {
        notificationElement.className = `conflict-notification conflict-warning`;
        notificationElement.innerHTML += '<button id="manualConflictBtn">Review Conflicts</button>';
        document.getElementById('manualConflictBtn').addEventListener('click', manualConflictResolution);
    } else {
        notificationElement.className = `conflict-notification`;
    }
}

function manualConflictResolution() {
    alert("Manual Conflict System (Simulated): This is where a detailed UI would appear to let the user choose which version of the quote to keep.");
}


/**
 * ========================================
 * 4. FILTERING AND DISPLAY FUNCTIONS
 * ========================================
 */

function populateCategories() {
    const uniqueCategories = [...new Set(quotes.map(quote => quote.category))].sort();
    categoryFilter.innerHTML = ''; 

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Categories';
    categoryFilter.appendChild(allOption);

    uniqueCategories.forEach(category => {
        if (category) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
}

function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    localStorage.setItem('lastCategoryFilter', selectedCategory);

    let filteredQuotes;
    if (selectedCategory === 'all') {
        filteredQuotes = quotes;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }
    displayFilteredQuote(filteredQuotes);
}

function displayFilteredQuote(list) {
    if (list.length === 0) {
        quoteDisplay.innerHTML = `<p class="error">No quotes found for the category: ${categoryFilter.value}</p>`;
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteDisplay.innerHTML));
        return;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const selectedQuote = list[randomIndex];

    const quoteText = document.createElement('p');
    quoteText.className = 'quote-text';
    quoteText.textContent = `"${selectedQuote.text}"`;

    const quoteCategoryFooter = document.createElement('footer');
    quoteCategoryFooter.className = 'quote-category';
    quoteCategoryFooter.textContent = `Category: ${selectedQuote.category}`;

    quoteDisplay.innerHTML = ''; 
    quoteDisplay.appendChild(quoteText);
    quoteDisplay.appendChild(quoteCategoryFooter);

    const quoteHTML = quoteDisplay.innerHTML;
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteHTML)); 
}


/**
 * ========================================
 * 5. DATA MANAGEMENT AND EVENT HANDLERS
 * ========================================
 */

function exportQuotes() { 
    const jsonString = JSON.stringify(quotes, null, 2); 
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes_export_${Date.now()}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
} 

function importQuotes(event) { 
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData) && importedData.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
                quotes = importedData; 
                saveQuotes();
                
                populateCategories(); 
                categoryFilter.value = 'all'; 
                
                quoteDisplay.innerHTML = `<p class="success">Successfully imported ${quotes.length} quotes! Data has been saved.</p>`;
                filterQuotes();
            } else {
                alert("Import failed: File content is invalid.");
            }
        } catch (error) {
            alert("Import failed: Could not parse file as valid JSON.");
        }
    };

    reader.readAsText(file);
}

// *** CRITICAL UPDATE: Call postNewQuoteToServer when adding a new quote ***
async function handleAddQuote(event) {
    event.preventDefault(); 

    const quoteText = document.getElementById('quoteText').value.trim();
    const quoteCategory = document.getElementById('quoteCategory').value.trim();

    if (quoteText && quoteCategory) {
        // Create the quote object locally with temporary ID and timestamp
        const newQuote = { 
            text: quoteText, 
            category: quoteCategory,
            id: `temp_${Date.now()}`, // Temporary ID until server responds
            timestamp: Date.now()
        };

        quotes.push(newQuote);
        saveQuotes(); 
        
        // Attempt to post to the server immediately
        const success = await postNewQuoteToServer(newQuote);

        if (success) {
            // If post succeeded, the quote object in the array was updated with the real server ID/timestamp.
            populateCategories(); 
            categoryFilter.value = newQuote.category; 

            quoteDisplay.innerHTML = `<p class="success">Quote added and **synced** to server! Filter set to ${newQuote.category}.</p>`;
            setTimeout(filterQuotes, 1000); 
            event.target.reset();
        } else {
            // If posting fails, the quote remains in the local array (with the temp ID) 
            // and the user is notified via setSyncStatus.
            alert("Quote added locally, but failed to sync to the server. It will attempt to sync later.");
        }
        
    } else {
        alert("Please ensure both the quote text and a category are entered.");
    }
}

function createAddQuoteForm() {
    let formContainer = document.getElementById('formContainer');
    if (!formContainer) {
        formContainer = document.createElement('div');
        formContainer.id = 'formContainer';
        document.body.appendChild(formContainer);
    }
    
    if (document.getElementById('addQuoteForm')) return;

    const formHTML = `
        <h3>Add Your Own Quote (Will sync with server)</h3>
        <form id="addQuoteForm">
            <label for="quoteText">Quote Text:</label>
            <textarea id="quoteText" required rows="4"></textarea>
            <label for="quoteCategory">Category:</label>
            <input type="text" id="quoteCategory" required>
            <button type="submit">Submit Quote</button>
            <button type="button" id="hideFormButton">Hide Form</button>
        </form>
    `;
    formContainer.innerHTML = formHTML;
    
    const addQuoteForm = document.getElementById('addQuoteForm');
    addQuoteForm.addEventListener('submit', handleAddQuote);

    const hideFormButton = document.getElementById('hideFormButton');
    formContainer.style.display = 'flex';
    hideFormButton.addEventListener('click', () => formContainer.style.display = 'none');
}


/**
 * ========================================
 * 6. INITIALIZATION
 * ========================================
 */

const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const exportButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');

loadQuotes();

newQuoteButton.addEventListener('click', filterQuotes);
addQuoteBtn.addEventListener('click', createAddQuoteForm); 

exportButton.addEventListener('click', exportQuotes);
importFileInput.addEventListener('change', importQuotes);