// 1a. Initial Array of Quote Objects
/**
 * ========================================
 * 1. DATA MANAGEMENT
 * ========================================
 */

// Use 'let' because we will be adding new quotes to this array
let quotes = [
    { text: "The best way to predict the future is to create it.", category: "Inspiration" },
    { text: "Strive not to be a success, but rather to be of value.", category: "Wisdom" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", category: "Motivation" },
    { text: "Where there is a will, there is a way.", category: "Inspiration" },
    { text: "The mind is everything. What you think you become.", category: "Wisdom" }
];

/**
 * ========================================
 * 2. CORE FUNCTION DEFINITIONS
 * (Defined first to avoid Reference Errors)
 * ========================================
 */

/**
 * Handles the submission of the new quote form.
 * Retrieves input values, updates the global 'quotes' array, and provides feedback.
 * @param {Event} event - The form submission event.
 */
function handleAddQuote(event) {
    // Prevents the browser from reloading the page upon form submission
    event.preventDefault(); 

    // Get the values from the form fields
    const quoteText = document.getElementById('quoteText').value.trim();
    const quoteCategory = document.getElementById('quoteCategory').value.trim();

    // Simple validation to ensure both fields are filled
    if (quoteText && quoteCategory) {
        const newQuote = {
            text: quoteText,
            category: quoteCategory
        };

        // Add the new quote object to the global array
        quotes.push(newQuote);

        // Display confirmation message temporarily
        quoteDisplay.innerHTML = `<p class="success">Quote added successfully! Loading new quote...</p>`;
        
        // Wait 1 second before showing a random quote (for better user experience)
        setTimeout(showRandomQuote, 1000); 

        // Clear the form fields after successful submission
        event.target.reset();
        
    } else {
        alert("Please ensure both the quote text and a category are entered.");
    }
}


/**
 * Creates and inserts the dynamic "Add Quote" form into the formContainer.
 */
function createAddQuoteForm() {
    // Exit if the form already exists to prevent duplication
    if (document.getElementById('addQuoteForm')) {
        return;
    }

    const formHTML = `
        <h3 style="color: #007bff;">Add Your Own Quote</h3>
        <form id="addQuoteForm">
            <label for="quoteText">Quote Text:</label>
            <textarea id="quoteText" required rows="4"></textarea>

            <label for="quoteCategory">Category:</label>
            <input type="text" id="quoteCategory" required>

            <button type="submit">Submit Quote</button>
            <button type="button" id="hideFormButton">Hide Form</button>
        </form>
    `;

    // Insert the HTML structure into the dynamic container
    formContainer.innerHTML = formHTML;

    // Attach event listeners to the new form elements

    // 1. Listen for the form submission
    const addQuoteForm = document.getElementById('addQuoteForm');
    addQuoteForm.addEventListener('submit', handleAddQuote);

    // 2. Listen for the "Hide Form" button click
    const hideFormButton = document.getElementById('hideFormButton');
    hideFormButton.addEventListener('click', () => {
        // Clearing the container effectively hides the form
        formContainer.innerHTML = ''; 
    });
}


/**
 * Displays a random quote from the 'quotes' array in the DOM.
 */
function showRandomQuote() {
    // Safety check: handle the case where the array is empty
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = '<p class="error">No quotes available. Add one!</p>';
        return;
    }

    // Math.random() generates a float between 0 (inclusive) and 1 (exclusive)
    // Multiplying by length and flooring it gives a valid index.
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedQuote = quotes[randomIndex];

    // Construct the HTML content using template literals
    const quoteHTML = `
        <p class="quote-text">"${selectedQuote.text}"</p>
        <footer class="quote-category">Category: ${selectedQuote.category}</footer>
    `;

    // Update the content of the quote display area
    quoteDisplay.innerHTML = quoteHTML;
}


/**
 * ========================================
 * 3. INITIALIZATION & EVENT LISTENERS
 * ========================================
 */

// 3a. Select DOM Elements (Assuming you added 'addQuoteBtn' to your HTML)
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');

// NOTE: You must have a button with id="addQuoteBtn" in your HTML for this to work.
const addQuoteBtn = document.getElementById('addQuoteBtn');


// 3b. Create a container for the dynamic form and append it to the body
const formContainer = document.createElement('div');
formContainer.id = 'formContainer';
document.body.appendChild(formContainer);


// 3c. Attach main event listeners

// Listen for the main "Show New Quote" button click
newQuoteButton.addEventListener('click', showRandomQuote);

// Listen for the "Add New Quote" button click (assuming the button exists)
if (addQuoteBtn) {
    addQuoteBtn.addEventListener('click', createAddQuoteForm);
}

// BONUS: Global keyboard shortcut to show the Add Form
document.addEventListener('keydown', (event) => {
    // Checks if the key pressed is 'A' (case-insensitive)
    if (event.key === 'a' || event.key === 'A') {
        createAddQuoteForm();
    }
});


// 3d. Initial call to load a quote when the script first runs
showRandomQuote();

