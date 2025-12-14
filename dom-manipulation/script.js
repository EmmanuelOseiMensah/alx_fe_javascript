/**
 * ========================================
 * 1. DATA AND STORAGE SETUP
 * ========================================
 */

// Default quotes used only if local storage is empty
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work", timestamp: Date.now() },
    { text: "Persistence can change failure into extraordinary achievement.", category: "Motivation", timestamp: Date.now() },
    { text: "Simplicity is the ultimate sophistication.", category: "Design", timestamp: Date.now() },
    { text: "The mind is everything. What you think you become.", category: "Wisdom", timestamp: Date.now() }
];

let quotes = []; // The live array of quotes, initialized by loadQuotes()
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5'; // Mock API for quotes
const SYNC_INTERVAL = 5000; // Sync every 5 seconds (for simulation)
let isSyncing = false; // Flag to prevent multiple concurrent sync operations


/**
 * ========================================
 * 2. STORAGE MANAGEMENT FUNCTIONS
 * ========================================
 */

/**
 * Saves the current 'quotes' array to Local Storage for persistence.
 */
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

/**
 * Loads quotes and initializes the filtering system, session data, and initial sync.
 */
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
    
    // 5. STEP 1: Start Server Simulation and Sync
    syncQuotes(); // Initial sync immediately
    setInterval(syncQuotes, SYNC_INTERVAL); // Periodic sync
}


/**
 * ========================================
 * 3. SERVER INTERACTION AND SYNC LOGIC
 * ========================================
 */

/**
 * Simulates fetching data from a server and standardizes the quote structure.
 * @returns {Promise<Array>} A promise that resolves with an array of standardized quote objects.
 */
async function fetchServerQuotes() {
    try {
        const response = await fetch(SERVER_URL);
        const serverPosts = await response.json();

        // Map mock posts to our quote structure (Simulating Server data structure)
        const serverQuotes = serverPosts.map(post => ({
            text: post.title.charAt(0).toUpperCase() + post.title.slice(1), // Use post title as text
            category: 'Server Update', // Fixed category for mock data
            id: post.id, // Unique ID for conflict resolution
            timestamp: Date.now() - Math.floor(Math.random() * 600000) // Simulate recent/old updates
        }));
        
        return serverQuotes;
    } catch (error) {
        console.error("Error fetching server data:", error);
        setSyncStatus("Sync Failed", 'error');
        return [];
    }
}

/**
 * STEP 2 & 3: Core synchronization function with conflict resolution.
 */
async function syncQuotes() {
    if (isSyncing) return;
    isSyncing = true;
    setSyncStatus("Syncing...", 'loading');

    const serverQuotes = await fetchServerQuotes();
    
    if (serverQuotes.length === 0) {
        isSyncing = false;
        setSyncStatus("Sync Complete: No server updates found.", 'success');
        return;
    }

    let mergeCount = 0;
    let conflictCount = 0;

    // STEP 2: Implement Data Syncing Logic
    const localQuotesMap = new Map(quotes.map(q => [q.id || `local_${q.text}`, q]));
    
    serverQuotes.forEach(serverQuote => {
        const serverId = serverQuote.id || `server_${serverQuote.text}`;
        const localQuote = localQuotesMap.get(serverId);
        
        if (localQuote) {
            // Conflict Check (Simulated: Server data always takes precedence)
            // We use timestamps (server's simulated timestamp vs. local timestamp)
            if (serverQuote.timestamp > localQuote.timestamp) {
                // Server data is newer/takes precedence (Conflict Resolution Strategy)
                localQuotesMap.set(serverId, serverQuote);
                conflictCount++;
            }
            // else: Local quote is newer/already present, keep local.
        } else {
            // New quote from the server
            localQuotesMap.set(serverId, serverQuote);
            mergeCount++;
        }
    });

    // Update the live quotes array
    quotes = Array.from(localQuotesMap.values());
    saveQuotes(); // Save updated merged list

    // STEP 3: Conflict Notification
    if (conflictCount > 0) {
        setConflictNotification(
            `Server sync resolved ${conflictCount} conflicts. Server data took precedence.`, 
            'warning'
        );
    } else {
        setConflictNotification('', ''); // Clear notification
    }

    // Finalize sync and update UI
    setSyncStatus(`Sync Complete. Added ${mergeCount} new quotes.`, 'success');
    populateCategories();
    filterQuotes(); // Refresh display with potentially new data
    
    isSyncing = false;
}

/**
 * Updates a dynamic UI element with the current sync status.
 * (Requires adding a <div id="syncStatus"> to the HTML)
 */
function setSyncStatus(message, type) {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `sync-status sync-${type}`;
    
    // Auto-clear success messages after a short time
    if (type === 'success') {
        setTimeout(() => {
             if (statusElement.textContent === message) {
                statusElement.textContent = 'Last synced successfully.';
                statusElement.className = 'sync-status sync-idle';
            }
        }, 3000);
    }
}

/**
 * Updates a dynamic UI element for persistent conflict alerts.
 * (Requires adding a <div id="conflictNotification"> to the HTML)
 */
function setConflictNotification(message, type) {
    const notificationElement = document.getElementById('conflictNotification');
    if (!notificationElement) return;

    notificationElement.textContent = message;
    notificationElement.className = `conflict-notification conflict-${type}`;

    if (type === 'warning' && message) {
        notificationElement.innerHTML += '<button id="manualConflictBtn" onclick="manualConflictResolution()">Review</button>';
    }
}

/**
 * STEP 3: Placeholder for manual conflict resolution (e.g., opening a modal).
 */
function manualConflictResolution() {
    alert("Manual Conflict Resolution System: This would open a modal showing local vs. server versions.");
}


/**
 * ========================================
 * 4. FILTERING AND DISPLAY FUNCTIONS
 * (Minimal changes, ensured compatibility with new quote structure)
 * ========================================
 */

// ... (populateCategories and filterQuotes remain largely the same, but simplified for brevity here) ...

/**
 * Extracts unique categories and populates the filter dropdown menu.
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
 * (Updated to add unique ID and timestamp to new quotes)
 * ========================================
 */

// ... (exportQuotes and importQuotes remain the same) ...

function handleAddQuote(event) {
    event.preventDefault(); 

    const quoteText = document.getElementById('quoteText').value.trim();
    const quoteCategory = document.getElementById('quoteCategory').value.trim();

    if (quoteText && quoteCategory) {
        // Updated to include ID and timestamp for server compatibility
        const newQuote = { 
            text: quoteText, 
            category: quoteCategory,
            id: Date.now(), // Use time as a unique ID for local quotes
            timestamp: Date.now()
        };

        quotes.push(newQuote);
        saveQuotes(); 
        
        populateCategories(); 
        categoryFilter.value = newQuote.category; 

        quoteDisplay.innerHTML = `<p class="success">Quote added and filter set to new category: ${newQuote.category}.</p>`;
        setTimeout(filterQuotes, 1000); 

        event.target.reset();
        
    } else {
        alert("Please ensure both the quote text and a category are entered.");
    }
}

function createAddQuoteForm() {
    // ... (Your existing form creation logic) ...
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
    hideFormButton.addEventListener('click', () => formContainer.innerHTML = '');
}


/**
 * ========================================
 * 6. INITIALIZATION
 * ========================================
 */

// Get DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const exportButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');

// Helper functions (for brevity, keeping them here)
function exportQuotes() { /* ... existing export logic ... */ }
function importQuotes(event) { /* ... existing import logic ... */ }

// 6a. Initialize: This must run first to load data and set up sync.
loadQuotes(); // Starts the sync interval

// 6b. Attach Event Listeners
newQuoteButton.addEventListener('click', filterQuotes);
addQuoteBtn.addEventListener('click', createAddQuoteForm); 

// Data Management Listeners
exportButton.addEventListener('click', exportQuotes);
importFileInput.addEventListener('change', importQuotes);