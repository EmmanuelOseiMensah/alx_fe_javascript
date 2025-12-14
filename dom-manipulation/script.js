/**
 * ========================================
 * 1. DATA AND STORAGE SETUP
 * ========================================
 */

// Default quotes used only if local storage is empty
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Persistence can change failure into extraordinary achievement.", category: "Motivation" },
    { text: "Simplicity is the ultimate sophistication.", category: "Design" },
    { text: "The mind is everything. What you think you become.", category: "Wisdom" }
];

let quotes = []; // The live array of quotes, initialized by loadQuotes()


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
    if (savedFilter) {
        // Apply saved filter if it exists in the new dropdown options
        if (categoryFilter.querySelector(`option[value="${savedFilter}"]`)) {
            categoryFilter.value = savedFilter;
        }
    }

    // 3. Display Content (Filter based on the saved state)
    filterQuotes(); // Use filterQuotes() to honor the saved filter immediately.

    // 4. Load Last Viewed Quote from Session Storage
    const lastQuoteHTML = sessionStorage.getItem('lastViewedQuote');
    if (lastQuoteHTML) {
        // Display the session-specific quote if found (overriding the filterQuotes initial view temporarily).
        quoteDisplay.innerHTML = `<p class="last-session-quote">Last viewed quote from session:</p>` + JSON.parse(lastQuoteHTML);
    }
}


/**
 * ========================================
 * 3. FILTERING FUNCTIONS
 * ========================================
 */

/**
 * Extracts unique categories and populates the filter dropdown menu.
 */
function populateCategories() {
    // Use map to get all categories, then Set to get unique ones.
    const uniqueCategories = [...new Set(quotes.map(quote => quote.category))].sort();

    // Start with the default option
    let optionsHTML = '<option value="all">All Categories</option>';

    // Build the options string
    uniqueCategories.forEach(category => {
        if (category) {
            optionsHTML += `<option value="${category}">${category}</option>`;
        }
    });

    categoryFilter.innerHTML = optionsHTML;
}

/**
 * Filters the main 'quotes' array based on the selected category and updates the display.
 */
function filterQuotes() {
    const selectedCategory = categoryFilter.value;
    
    // Save the selected category to Local Storage for persistence.
    localStorage.setItem('lastCategoryFilter', selectedCategory);

    // Filter the quotes
    let filteredQuotes;
    if (selectedCategory === 'all') {
        filteredQuotes = quotes;
    } else {
        // Array.prototype.filter() creates a new array with only elements that pass the test.
        filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
    }

    // Pass the filtered list to the display helper function.
    displayFilteredQuote(filteredQuotes);
}

/**
 * Helper function to randomly select and display ONE quote from a provided list.
 * It also handles saving the displayed quote to Session Storage.
 * @param {Array} list - The list of quotes to choose from (already filtered).
 */
function displayFilteredQuote(list) {
    if (list.length === 0) {
        quoteDisplay.innerHTML = `<p class="error">No quotes found for the category: ${categoryFilter.value}</p>`;
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteDisplay.innerHTML));
        return;
    }

    // Pick a random quote from the filtered list
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
 * 4. JSON IMPORT AND EXPORT FUNCTIONS
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
                
                // *** Update Categories and Filter after successful import ***
                populateCategories(); 
                categoryFilter.value = 'all'; // Reset filter to 'all' after import
                
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
 * 5. EVENT HANDLERS
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
        saveQuotes(); // Save the updated list to Local Storage.
        
        // *** Update Categories and Filter after adding a new quote ***
        populateCategories(); // Re-scan for new categories.
        categoryFilter.value = newQuote.category; // Set filter to the new category.

        quoteDisplay.innerHTML = `<p class="success">Quote added and filter set to new category: ${newQuote.category}.</p>`;
        setTimeout(filterQuotes, 1000); // Wait and then display a filtered quote.

        event.target.reset();
        
    } else {
        alert("Please ensure both the quote text and a category are entered.");
    }
}

/**
 * Dynamically creates and displays the form to add a new quote.
 */
function createAddQuoteForm() {
    // 1. Ensure the form container exists
    let formContainer = document.getElementById('formContainer');
    if (!formContainer) {
        formContainer = document.createElement('div');
        formContainer.id = 'formContainer';
        document.body.appendChild(formContainer);
    }
    
    // 2. Prevent the form from being created multiple times
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
    
    // 3. Attach listeners to the dynamically created elements
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

// 6a. Initialize: This must run first to load data and set up filters.
loadQuotes();

// 6b. Attach Event Listeners
// Clicking 'New Quote' now applies the current filter state.
newQuoteButton.addEventListener('click', filterQuotes);
addQuoteBtn.addEventListener('click', createAddQuoteForm); 

// Data Management Listeners
exportButton.addEventListener('click', exportQuotes);
importFileInput.addEventListener('change', importQuotes);
// The 'onchange' handler for filterQuotes is already in the HTML.