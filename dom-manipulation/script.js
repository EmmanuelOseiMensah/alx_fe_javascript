/**
 * ========================================
 * 1. DATA AND STORAGE SETUP
 * ========================================
 */

// Initial default quotes (used only if local storage is completely empty)
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "Persistence can change failure into extraordinary achievement.", category: "Motivation" },
    { text: "Simplicity is the ultimate sophistication.", category: "Design" }
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
    // Converts the JavaScript array into a JSON string, which is the only format localStorage accepts.
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

/**
 * Loads quotes from Local Storage on startup. Handles initialization from default data.
 * Also checks Session Storage for the last viewed quote.
 */
function loadQuotes() {
    // 1. Load from Local Storage (Persistence across browser sessions)
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
        // Converts the JSON string back into a usable JavaScript array.
        quotes = JSON.parse(storedQuotes);
    } else {
        // Use default data if no quotes are found in storage.
        quotes = defaultQuotes;
        saveQuotes(); // Save the defaults immediately.
    }

    // 2. Load from Session Storage (Temporary session data)
    const lastQuoteHTML = sessionStorage.getItem('lastViewedQuote');
    if (lastQuoteHTML) {
        // Display the last quote shown before the browser tab was closed/refreshed.
        quoteDisplay.innerHTML = `<p class="last-session-quote">Last viewed quote from session:</p>` + JSON.parse(lastQuoteHTML);
    } else {
        // If no session data, display a fresh random quote.
        showRandomQuote();
    }
}


/**
 * ========================================
 * 3. JSON IMPORT AND EXPORT FUNCTIONS
 * ========================================
 */

/**
 * Allows the user to download the current quotes array as a JSON file.
 */
function exportQuotes() {
    // 1. Convert the JavaScript array into a readable JSON string (using '2' for indentation).
    const jsonString = JSON.stringify(quotes, null, 2); 
    
    // 2. Create a Blob (Binary Large Object) containing the JSON data for download.
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 3. Create a temporary download URL for the Blob.
    const url = URL.createObjectURL(blob);
    
    // 4. Create a temporary <a> element to trigger the download.
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes_export_${Date.now()}.json`; // Unique filename
    
    // 5. Simulate a click to start the download and clean up the temporary element/URL.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Release the temporary resource.
} 

/**
 * Reads a JSON file uploaded by the user, validates it, and updates application state.
 * @param {Event} event - The file input change event.
 */
function importQuotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // Attempt to convert the file content (text) into a JavaScript object.
            const importedData = JSON.parse(e.target.result);
            
            // Validation: Must be an array, and every item must have 'text' and 'category'.
            if (Array.isArray(importedData) && importedData.every(q => typeof q.text === 'string' && typeof q.category === 'string')) {
                // Update the live data and save it persistently.
                quotes = importedData; 
                saveQuotes();
                
                quoteDisplay.innerHTML = `<p class="success">Successfully imported ${quotes.length} quotes! Data has been saved.</p>`;
                showRandomQuote();
            } else {
                alert("Import failed: File content is invalid. Ensure it is an array of objects with 'text' and 'category' keys.");
            }
        } catch (error) {
            alert("Import failed: Could not parse file as valid JSON.");
            console.error("JSON Parsing Error:", error);
        }
    };

    // Tell the reader to read the uploaded file as plain text.
    reader.readAsText(file);
}


/**
 * ========================================
 * 4. CORE APPLICATION LOGIC
 * ========================================
 */

/**
 * Displays a random quote and saves it to Session Storage.
 */
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = '<p class="error">No quotes available. Add one!</p>';
        return;
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedQuote = quotes[randomIndex];

    const quoteHTML = `
        <p class="quote-text">"${selectedQuote.text}"</p>
        <footer class="quote-category">Category: ${selectedQuote.category}</footer>
    `;

    quoteDisplay.innerHTML = quoteHTML;

    // Save the displayed HTML to Session Storage for the 'last viewed' feature.
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quoteHTML)); 
}

/**
 * Handles form submission, adds the new quote, and saves the updated list to Local Storage.
 */
function handleAddQuote(event) {
    event.preventDefault(); 

    const quoteText = document.getElementById('quoteText').value.trim();
    const quoteCategory = document.getElementById('quoteCategory').value.trim();

    if (quoteText && quoteCategory) {
        const newQuote = { text: quoteText, category: quoteCategory };

        quotes.push(newQuote);
        saveQuotes(); // *** Critical: Update Local Storage after adding a new quote ***

        quoteDisplay.innerHTML = `<p class="success">Quote added and saved! Loading new quote...</p>`;
        setTimeout(showRandomQuote, 1000); 

        event.target.reset();
        
    } else {
        alert("Please ensure both the quote text and a category are entered.");
    }
}

/**
 * Dynamically creates and displays the form to add a new quote.
 */
function createAddQuoteForm() {
    // 1. Ensure the form container exists (or create it if it was cleared)
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
 * 5. INITIALIZATION AND EVENT LISTENERS
 * ========================================
 */

// Get DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const exportButton = document.getElementById('exportQuotes');
const importFileInput = document.getElementById('importFile');

// 5a. Initialize Quotes: This must run first to load data from storage.
loadQuotes();

// 5b. Attach Event Listeners
newQuoteButton.addEventListener('click', showRandomQuote);
addQuoteBtn.addEventListener('click', createAddQuoteForm); 

// Data Management Listeners
exportButton.addEventListener('click', exportQuotes);
// The 'change' event fires when a file is selected via the input.
importFileInput.addEventListener('change', importQuotes);