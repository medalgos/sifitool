/**
 * Main JavaScript file for shared functionality across the MedCalc platform
 */

// Initialize the site when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSite);

/**
 * Main initialization function
 */
function initializeSite() {
    // Initialize navigation functionality
    initializeNavigation();
    
    // Initialize tab switching functionality if tabs are present
    initializeTabs();
    
    // Initialize form validation if forms are present
    if (document.querySelector('form')) {
        initializeFormValidation();
    }
}

/**
 * Initialize responsive navigation
 */
function initializeNavigation() {
    // Add mobile menu toggle functionality if needed in the future
    const nav = document.querySelector('.nav-links');
    if (!nav) return;
    
    // Placeholder for future mobile menu toggle implementation
}

/**
 * Initialize tab switching functionality
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return;
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Get tab ID
            const tabId = e.currentTarget.dataset.tab;
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            e.currentTarget.classList.add('active');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content, .approach-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show selected tab content
            const targetContent = document.getElementById(`${tabId}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // For backwards compatibility with approach-content
            const approachContent = document.getElementById(`${tabId}-content`) || 
                                    document.getElementById(tabId + '-content');
            if (approachContent) {
                approachContent.classList.add('active');
                
                // Additional event for tool-specific initialization
                const event = new CustomEvent('tabChanged', { detail: { tabId } });
                document.dispatchEvent(event);
            }
        });
    });
}

/**
 * Initialize form validation
 */
function initializeFormValidation() {
    // Mark required fields
    document.querySelectorAll('[required]').forEach(field => {
        field.setAttribute('data-required', 'true');
        
        // Add validation event listeners
        field.addEventListener('invalid', highlightInvalidField);
        field.addEventListener('input', clearInvalidState);
    });
    
    // Process forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                highlightAllInvalidFields(this);
            }
        });
    });
}

/**
 * Highlight invalid form field
 */
function highlightInvalidField(event) {
    const field = event.target;
    field.classList.add('invalid-field');
    
    // Create or update validation message
    let validationMessage = field.nextElementSibling;
    if (!validationMessage || !validationMessage.classList.contains('field-validation-message')) {
        validationMessage = document.createElement('div');
        validationMessage.className = 'field-validation-message';
        field.parentNode.insertBefore(validationMessage, field.nextSibling);
    }
    
    validationMessage.textContent = field.validationMessage;
}

/**
 * Highlight all invalid fields in a form
 */
function highlightAllInvalidFields(form) {
    form.querySelectorAll(':invalid').forEach(field => {
        field.classList.add('invalid-field');
        
        // Trigger the invalid event to show validation messages
        const event = new Event('invalid', { bubbles: true, cancelable: true });
        field.dispatchEvent(event);
    });
    
    // Scroll to the first invalid field
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
    }
}

/**
 * Clear invalid state when field is corrected
 */
function clearInvalidState(event) {
    const field = event.target;
    
    if (field.checkValidity()) {
        field.classList.remove('invalid-field');
        
        // Remove validation message if it exists
        const validationMessage = field.nextElementSibling;
        if (validationMessage && validationMessage.classList.contains('field-validation-message')) {
            validationMessage.textContent = '';
        }
    }
}

/**
 * Reset a form completely
 * @param {string} formId - The ID of the form to reset
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Reset the form
    form.reset();
    
    // Clear validation states
    form.querySelectorAll('.invalid-field').forEach(field => {
        field.classList.remove('invalid-field');
    });
    
    // Clear validation messages
    form.querySelectorAll('.field-validation-message').forEach(message => {
        message.textContent = '';
    });
    
    // Clear any result containers
    document.querySelectorAll('[id$="resultContainer"]').forEach(container => {
        container.innerHTML = '';
    });
    
    // Reset any custom elements like selected classes
    form.querySelectorAll('.selected').forEach(element => {
        element.classList.remove('selected');
    });
    
    // Dispatch form reset event for tool-specific cleanup
    const event = new CustomEvent('formReset', { detail: { formId } });
    document.dispatchEvent(event);
}

// Make functions available globally
window.resetForm = resetForm;