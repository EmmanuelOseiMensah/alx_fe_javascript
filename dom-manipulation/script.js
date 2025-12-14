/**
 * ========================================
 * 1. DATA AND SERVER CONFIGURATION
 * ========================================
 */

// Mock server URL for READ operation (we use JSONPlaceholder /posts)
const SERVER_READ_URL = 'https://jsonplaceholder.typicode.com/posts';
const SYNC_INTERVAL_MS = 30000; // Periodic sync every 30 seconds (30 seconds)

// Default quotes used only if local storage is empty
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Persistence can change failure into extraordinary achievement.", category: "Motivation" },
    { text: "Simplicity is the ultimate sophistication.", category: "Design" },
    { text: "The mind is everything. What you think you become.", category: "Wisdom" }
];

let quotes = []; // The live array of quotes, initialized by initializeApp()


/**
 * ========================================
 * 2. STORAGE MANAGEMENT FUNCTIONS
 * ========================================
 */

/**
 * Saves the current 'quotes' array to Local Storage for persistence.
 */
function saveQuotes() {
    // JSON.stringify converts the JavaScript array into a string for storage.
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

/**
 * Loads quotes and initializes the filtering system and session data.
 */
function loadQuotes() {
    // 1. Load Data from Local Storage
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        quotes = JSON.parse(storedQuotes); // Convert JSON string back to array.
    } else {
        quotes = defaultQuotes;
        saveQuotes();
    }

    // 2. Initialize Categories and Restore Filter State
    populateCategories();
    const savedFilter = localStorage.getItem('lastCategoryFilter');
    if (savedFilter && categoryFilter.querySelector(`option[value="${savedFilter}"]`)) {
        categoryFilter.value = savedFilter;
    }

    // 3. Display Content (Filter based on the saved state)
    filterQuotes();

    // 4. Load Last Viewed Quote from Session Storage
    const lastQuoteHTML = sessionStorage.getItem('lastViewedQuote');
    if (lastQuoteHTML) {
        // Display the session-specific quote if found (overriding the filterQuotes initial view temporarily).
        quoteDisplay.innerHTML = `<p class="last-session-quote">Last viewed quote from session:</p>` + JSON.parse(lastQuoteHTML);
    }
}


/**
 * ========================================
 * 3. SYNC AND CONFLICT RESOLUTION
 * ========================================
 */

/**
 * Simulates fetching data from the server and performs conflict resolution.
 * Server data takes precedence (Last-Write-Wins strategy).
 */
async function syncData() {
    const syncNotification = document.getElementById('syncNotification');
    syncNotification.textContent = 'Syncing...';
    syncNotification.className = 'notification syncing';

    try {
        // --- 1. Fetch Server Data ---
        const response = await fetch(SERVER_READ_URL);
        if (!response.ok) throw new Error('Server read failed.');
        
        const serverPosts = await response.json();
        
        // --- 2. Normalize Server Data ---
        // Simulate normalization: use post title as text, categorize as 'Server Sync'.
        const serverQuotes = serverPosts.slice(0, 10).map(post => ({
            text: post.title.substring(0, 80),
            category: 'Server Sync'
        }));

        // --- 3. Conflict Resolution (Server Wins) ---
        let localQuoteCount = quotes.length;
        let serverQuoteCount = serverQuotes.length;
        let notificationMessage;

        if (serverQuoteCount > 0) {
            // Overwrite local quotes with server quotes (Server wins)
            quotes = serverQuotes;
            saveQuotes();
            
            // Re-initialize UI after data change
            populateCategories();
            filterQuotes();

            notificationMessage = `Sync successful: ${serverQuoteCount} quotes loaded from server.`;
            if (localQuoteCount > serverQuoteCount) {
                notificationMessage += ` (Overwrote ${localQuoteCount} local quotes)`;
            }

            syncNotification.textContent = notificationMessage;
            syncNotification.className = 'notification success';
        } else {
            // Server returned no usable data.
            syncNotification.textContent = 'Sync complete. Server returned no new data.';
            syncNotification.className = 'notification warning';
        }

    } catch (error) {
        console.error("Sync Error:", error);
        syncNotification.textContent = 'Sync failed. Check console for details.';
        syncNotification.className = 'notification error';
    } 

    // Clear notification after a delay
    setTimeout(() => { syncNotification.textContent = ''; syncNotification.className = 'notification'; }, 5000);
}


/**
 * ========================================
 * 4. FILTERING FUNCTIONS
 * ========================================
 */

/**
 * Extracts unique categories and populates the filter dropdown menu.
 */
function populateCategories() {
    // Get unique categories and sort them alphabetically
    const uniqueCategories = [...new Set(quotes.map(quote => quote.category))].sort();

    let optionsHTML = '<option value="all">All Categories</option>';

    uniqueCategories.forEach(category => {
        if (category) {
            optionsHTML += `<option value="${category}">${category}</option>`;
        }
    });

    categoryFilter.innerHTML = optionsHTML;
    
    // Attempt to restore the filter selection after repopulating
    const savedFilter = localStorage.getItem('lastCategoryFilter');
    if (savedFilter && categoryFilter.querySelector(`option[value="${savedFilter}"]`)) {
        categoryFilter.value = savedFilter;
    }
}

/**
 * Filters the main 'quotes' array based on the selected category and updates the display.
 */
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    
    // Save the selected category to Local Storage for persistence.
    localStorage.setItem('lastCategoryFilter', selectedCategory);

    let filteredQuotes;
    if (selectedCategory === 'all') {
        filteredQuotes = quotes;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }

    displayFilteredQuote(filteredQuotes);
}

/**
 * Helper function to randomly select and display ONE quote from a provided list.
 */
function displayFilteredQuote(list) {
    if (list.length === 0) {
        quoteDisplay.innerHTML = `<p class="error">No quotes found for the category: ${categoryFilter.value}</p>`;
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteDisplay.innerHTML));
        return;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const selectedQuote = list[randomIndex];

    const quoteHTML = `
        <p class="quote-text">"${selectedQuote.text}"</p>
        <footer class="quote-category">Category: ${selectedQuote.category}</footer>
    `;

    quoteDisplay.innerHTML = quoteHTML;

    // Save the displayed HTML to Session Storage for 'last viewed' feature.
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteHTML)); 
}


/**
 * ========================================
 * 5. JSON IMPORT AND EXPORT FUNCTIONS
 * ========================================
 */

/**
 * Allows the user to download the current quotes array as a JSON file.
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

/**
 * Reads a JSON file uploaded by the user, validates it, and updates application state.
 */
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


/**
 * ========================================
 * 6. EVENT HANDLERS
 * ========================================
 */

/**
 * Handles form submission, adds the new quote, saves, and updates categories/filter.
 */
function handleAddQuote(event) {
    event.preventDefault(); 

    const quoteText = document.getElementById('quoteText').value.trim();
    const quoteCategory = document.getElementById('quoteCategory').value.trim();

    if (quoteText && quoteCategory) {
        const newQuote = { text: quoteText, category: quoteCategory };

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

/**
 * Dynamically creates and displays the form to add a new quote.
 */
function createAddQuoteForm() {
    let formContainer = document.getElementById('formContainer');
    if (!formContainer) {
        formContainer = document.createElement('div');
        formContainer.id = 'formContainer';
        document.body.appendChild(formContainer);
    }
    
    if (document.getElementById('addQuoteForm')) return;

    const formHTML = `
        <h3>Add Your Own Quote</h3>
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
 * 7. INITIALIZATION
 * ========================================
 */

/**
 * Starts the application and initializes the periodic sync process.
 */
function initializeApp() {
    // 1. Load initial data from Local Storage
    loadQuotes(); 
    
    // 2. Initial Sync on load (delayed slightly to allow UI to load)
    setTimeout(syncData, 2000);

    // 3. Set up the periodic sync
    setInterval(syncData, SYNC_INTERVAL_MS);
}


// Get DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const exportButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');
const syncButton = document.getElementById('syncButton');


// Attach Event Listeners
newQuoteButton.addEventListener('click', filterQuotes);
addQuoteBtn.addEventListener('click', createAddQuoteForm); 

exportButton.addEventListener('click', exportQuotes);
importFileInput.addEventListener('change', importQuotes);

syncButton.addEventListener('click', syncData); // Manual sync trigger

// Start Application
initializeApp();