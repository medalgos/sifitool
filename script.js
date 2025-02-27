// script.js

// Function to update required fields based on active tab
function updateRequiredFields() {
    // Get all tabs
    const tabs = document.querySelectorAll('.tab');
    
    // Find active tab
    const activeTab = document.querySelector('.tab.active');
    const activeApproach = activeTab.dataset.tab;
    
    // Get both content sections
    const conventionalContent = document.getElementById('conventional-content');
    const reverseContent = document.getElementById('reverse-content');
    
    // Function to toggle required attributes
    function toggleRequired(container, isRequired) {
        const requiredFields = container.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (isRequired) {
                field.setAttribute('required', '');
            } else {
                field.removeAttribute('required');
            }
        });
    }
    
    // Toggle required based on active tab
    if (activeApproach === 'conventional') {
        toggleRequired(conventionalContent, true);
        toggleRequired(reverseContent, false);
    } else {
        toggleRequired(conventionalContent, false);
        toggleRequired(reverseContent, true);
    }
}



function switchTab(event, approach) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Add active class to clicked tab
    event.currentTarget.classList.add('active');

    // Hide all content sections
    document.querySelectorAll('.approach-content').forEach(content => {
        content.classList.remove('active');
        // Disable required attributes on hidden content
        content.querySelectorAll('[required]').forEach(field => {
            field.removeAttribute('required');
        });
    });

    // Show selected content and enable its required fields
    const activeContent = document.getElementById(`${approach}-content`);
    activeContent.classList.add('active');
    activeContent.querySelectorAll('[data-required="true"]').forEach(field => {
        field.setAttribute('required', '');
    });
}


function initializeFormValidation() {
    // Add data-required attribute to all required fields
    document.querySelectorAll('[required]').forEach(field => {
        field.setAttribute('data-required', 'true');
    });

    // Initial setup for active tab
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const approach = activeTab.dataset.tab;
        switchTab({ currentTarget: activeTab }, approach);
    }
}

// Add to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
    // ... rest of your initialization code
});

// Reset form functionality
function resetForm() {
    // Reset all form fields
    document.getElementById('sifiForm').reset();
    document.getElementById('reverseresultContainer').innerHTML = '';
    document.getElementById('conventionalresultContainer').innerHTML = '';
    clearTiterVisualization();
    // Clear all validation messages
    document.querySelectorAll('.validation-message').forEach(message => {
        message.innerHTML = '';
    });

    // Reset treatment options
    document.querySelectorAll('.treatment-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Handle both conventional and reverse tabs
    ['conventional', 'reverse'].forEach(tab => {
        // Clear date validation messages
        const dateValidationMessage = document.getElementById(`${tab}DateValidationMessage`);
        if (dateValidationMessage) {
            dateValidationMessage.innerHTML = '';
        }

        // Reset and hide TP-PA field if it exists
        const treponemalTest = document.querySelector(`#${tab}-content .form-group #treponemalTest`);
        if (treponemalTest) {
            treponemalTest.value = '';
            treponemalTest.closest('.form-group').style.display = 'none';
        }
    });

    // Reset titer groups
    ['maternal', 'infant'].forEach(type => {
        ['conventional', 'reverse'].forEach(tab => {
            const container = document.getElementById(`${tab}${type}TiterContainer`);
            if (container) {
                // Remove all titer groups except the first one
                const groups = container.querySelectorAll('.titer-group');
                groups.forEach((group, index) => {
                    if (index > 0) group.remove();
                });
                
                // Reset the first group
                const firstGroup = container.querySelector('.titer-group');
                if (firstGroup) {
                    firstGroup.querySelector('select').value = '';
                    firstGroup.querySelector('input[type="date"]').value = '';
                }
            }
        });
    });
}

// Date Validation
function initializeDateValidation() {
    function validateDates() {
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        const deliveryDateInput = document.getElementById(`${activeTab}DeliveryDate`);
        const treatmentDate1Input = document.getElementById(`${activeTab}TreatmentDate1`);
        const treatmentDate2Input = document.getElementById(`${activeTab}TreatmentDate2`);
        const treatmentDate3Input = document.getElementById(`${activeTab}TreatmentDate3`);
        const validationMessage = document.getElementById(`${activeTab}DateValidationMessage`);

        if (!deliveryDateInput || !treatmentDate1Input || !treatmentDate2Input || !treatmentDate3Input || !validationMessage) {
            return;
        }

        if (!deliveryDateInput.value || !treatmentDate1Input.value || !treatmentDate2Input.value || !treatmentDate3Input.value) {
            validationMessage.innerHTML = '';
            return;
        }

        const deliveryDate = new Date(deliveryDateInput.value);
        const treatmentDate1 = new Date(treatmentDate1Input.value);
        const treatmentDate2 = new Date(treatmentDate2Input.value);
        const treatmentDate3 = new Date(treatmentDate3Input.value);
        const daysDifference1 = Math.floor((deliveryDate - treatmentDate1) / (1000 * 3600 * 24));
        const daysDifference2 = Math.floor((treatmentDate2 - treatmentDate1) / (1000 * 3600 * 24));
        const daysDifference3 = Math.floor((treatmentDate3 - treatmentDate2) / (1000 * 3600 * 24));

        let messageHTML = '';

        if (daysDifference1 < 0) {
            messageHTML += `
                <div class="validation-alert error">
                    <span class="alert-icon">⚠️</span>
                    <div class="alert-content">
                        <strong>Invalid Treatment Date</strong>
                        <p>Treatment date cannot be after delivery date.</p>
                    </div>
                </div>
            `;
        } else if (daysDifference1 < 30) {
            messageHTML += `
                <div class="validation-alert warning">
                    <span class="alert-icon">⚠️</span>
                    <div class="alert-content">
                        <strong>Treatment Less Than 30 Days Before Delivery</strong>
                        <p>Treatment was given ${daysDifference1} days before delivery.</p>
                        <p>This is considered inadequate treatment timing.</p>
                    </div>
                </div>
            `;
        } else {
            messageHTML += `
                <div class="validation-alert success">
                    <span class="alert-icon">✅</span>
                    <div class="alert-content">
                        <strong>Adequate Treatment Timing</strong>
                        <p>Treatment was given ${daysDifference1} days before delivery.</p>
                        <p>This meets or exceeds the 30-day requirement.</p>
                    </div>
                </div>
            `;
        }

        if (daysDifference2 > 9 || daysDifference3 > 9) {
            messageHTML += `
                <div class="validation-alert warning">
                    <span class="alert-icon">⚠️</span>
                    <div class="alert-content">
                        <strong>Delay Between Treatments</strong>
                        <p>The guideline specifies that delays beyond 9 days between weekly doses require restarting the course.</p>
                    </div>
                </div>
            `;
        }

        validationMessage.innerHTML = messageHTML;
    }

    // Add event listeners to date inputs
    ['conventional', 'reverse'].forEach(tab => {
        const deliveryDate = document.getElementById(`${tab}DeliveryDate`);
        const treatmentDate1 = document.getElementById(`${tab}TreatmentDate1`);
        const treatmentDate2 = document.getElementById(`${tab}TreatmentDate2`);
        const treatmentDate3 = document.getElementById(`${tab}TreatmentDate3`);
        
        if (deliveryDate) deliveryDate.addEventListener('change', validateDates);
        if (treatmentDate1) treatmentDate1.addEventListener('change', validateDates);
        if (treatmentDate2) treatmentDate2.addEventListener('change', validateDates);
        if (treatmentDate3) treatmentDate3.addEventListener('change', validateDates);
    });
}

// RPR Handler
function initializeRPRHandler() {
    const rprSelect = document.getElementById('reverserprResult');
    if (!rprSelect) return;

    const parentRow = rprSelect.closest('.form-row');
    if (!parentRow) return;

    // Create treponemal test group
    const treponemalGroup = document.createElement('div');
    treponemalGroup.className = 'form-group';
    treponemalGroup.style.display = 'none';
    treponemalGroup.innerHTML = `
        <label for="reversetreponemalTest">Alternative Treponemal Test (TP-PA):</label>
        <select id="reversetreponemalTest" name="reversetreponemalTest">
            <option value="">Select result...</option>
            <option value="reactive">Reactive</option>
            <option value="nonreactive">Nonreactive</option>
        </select>
    `;

    // Add treponemal group to form
    parentRow.appendChild(treponemalGroup);

    // Create info messages
    const infoMessage = document.createElement('div');
    infoMessage.className = 'validation-message';
    infoMessage.style.display = 'none';
    infoMessage.innerHTML = `
        <div class="validation-alert warning">
            <div class="alert-content">
                <p>A second treponemal test is required when RPR/VDRL is nonreactive to confirm initial results.</p>
            </div>
        </div>
        <br>
    `;

    const doubleNegativeAlert = document.createElement('div');
    doubleNegativeAlert.className = 'validation-message';
    doubleNegativeAlert.style.display = 'none';
    doubleNegativeAlert.innerHTML = `
        <div class="validation-alert info">
            <div class="alert-content">
                <p><strong>Additional Considerations:</strong></p>
                <ul>
                    <li>If epidemiologic risk and clinical probability of syphilis is low, no further evaluation is required</li>
                    <li>If not low, consider repeat RPR or VDRL in 2-4 weeks to differentiate early primary infection from false positive</li>
                </ul>
            </div>
        </div>
    `;

    // Add messages to page
    parentRow.after(infoMessage);
    parentRow.after(doubleNegativeAlert);

    // Add RPR change listener
    rprSelect.addEventListener('change', function() {
        const treponemalTest = document.getElementById('reversetreponemalTest');
        if (this.value === 'nonreactive') {
            treponemalGroup.style.display = 'block';
            infoMessage.style.display = 'block';
            doubleNegativeAlert.style.display = 'none';
            treponemalTest.setAttribute('required', 'required');
        } else {
            treponemalGroup.style.display = 'none';
            infoMessage.style.display = 'none';
            doubleNegativeAlert.style.display = 'none';
            treponemalTest.removeAttribute('required');
            treponemalTest.value = '';
        }
    });

    // Add treponemal test listener
    document.getElementById('reversetreponemalTest').addEventListener('change', function() {
        if (rprSelect.value === 'nonreactive' && this.value === 'nonreactive') {
            doubleNegativeAlert.style.display = 'block';
        } else {
            doubleNegativeAlert.style.display = 'none';
        }
    });
}

// Titer Handling
function initializeTiterHandling() {
    function addNewTiterGroup(container, type) {
        const tab = document.querySelector('.tab.active').dataset.tab;
        const isMaternalTiter = type === 'maternal';
        const prefix = `${tab}_${type}`;
        const labelText = isMaternalTiter ? 'Maternal Titer' : 'Infant Titer';
        const dateLabel = isMaternalTiter ? 'Date of Collection' : 'Date Collected';

        const newGroup = document.createElement('div');
        newGroup.className = 'titer-group';
        newGroup.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label for="${prefix}_titer">${labelText}:</label>
                    <select id="${prefix}_titer" name="${prefix}_titer[]" required>
                        <option value="">Select titer...</option>
                        <option value="1">1:1</option>
                        <option value="2">1:2</option>
                        <option value="4">1:4</option>
                        <option value="8">1:8</option>
                        <option value="16">1:16</option>
                        <option value="32">1:32</option>
                        <option value="64">1:64</option>
                        <option value="128">1:128</option>
                        <option value="256">1:256</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="${prefix}_collection_date">${dateLabel}:</label>
                    <input type="date" id="${prefix}_collection_date" name="${prefix}_collection_date[]" required>
                </div>
                <button type="button" class="add-titer-btn">+</button>
            </div>
        `;

        container.appendChild(newGroup);
        updateButtonStates(container);
        attachTiterEventListeners(newGroup, type);
    }

    function updateButtonStates(container) {
        const groups = container.querySelectorAll('.titer-group');
        groups.forEach((group, index) => {
            const button = group.querySelector('button');
            if (index === 0) {
                button.className = 'add-titer-btn';
                button.textContent = '+';
            } else {
                button.className = 'remove-titer-btn';
                button.textContent = '-';
            }
        });
    }

    function attachTiterEventListeners(group, type) {
        const tab = document.querySelector('.tab.active').dataset.tab;
        const titerSelect = group.querySelector(`select[name="${tab}_${type}_titer[]"]`);
        const dateInput = group.querySelector(`input[name="${tab}_${type}_collection_date[]"]`);

        if (titerSelect) {
            titerSelect.addEventListener('change', validateMaternalTiters);
        }
        if (dateInput) {
            dateInput.addEventListener('change', validateMaternalTiters);
        }
    }

    function validateMaternalTiters() {
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        const container = document.getElementById(`${activeTab}maternalTiterContainer`);
        const validationMessage = document.getElementById(`${activeTab}TiterValidationMessage`);
        console.log(container);
        console.log(validationMessage);
        if (!container || !validationMessage) {
            return;
        }

        const titerGroups = Array.from(container.querySelectorAll('.titer-group'));
        console.log(titerGroups);
        if (titerGroups.length < 2) {
            validationMessage.innerHTML = '';
            return;
        }

        // Extract titer values and dates
        const titers = titerGroups.map(group => {
            const titerValue = parseInt(group.querySelector(`select[name="${activeTab}_maternal_titer[]"]`).value);
            const collectionDate = new Date(group.querySelector(`input[name="${activeTab}_maternal_collection_date[]"]`).value);
            return { titerValue, collectionDate };
        });

        // Sort by collection date
        titers.sort((a, b) => a.collectionDate - b.collectionDate);
        console.log("Titers ", titers);
        // Check for fourfold or greater increase
        let messageHTML = '';
        for (let i = 1; i < titers.length; i++) {
            if (titers[i].titerValue >= 4 * titers[i - 1].titerValue) {
                messageHTML = `
                    <div class="validation-alert warning">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <strong>Evidence of Maternal Reinfection or Relapse</strong>
                            <p>There is a fourfold or greater increase in maternal titers.</p>
                        </div>
                    </div>
                `;
                break;
            }
        }

        validationMessage.innerHTML = messageHTML;
    }

    ['maternal', 'infant'].forEach(type => {
        const tab = document.querySelector('.tab.active').dataset.tab;
        const container = document.getElementById(`${tab}${type}TiterContainer`);

        if (container) {
            const clone = container.cloneNode(true);
            container.parentNode.replaceChild(clone, container);

            clone.addEventListener('click', function(e) {
                if (e.target.classList.contains('add-titer-btn')) {
                    addNewTiterGroup(clone, type);
                } else if (e.target.classList.contains('remove-titer-btn')) {
                    const groups = clone.querySelectorAll('.titer-group');
                    if (groups.length > 1) {
                        e.target.closest('.titer-group').remove();
                        updateButtonStates(clone);
                    }
                }
                if (type === 'maternal') {
                    validateMaternalTiters();
                }
            });

            if (!clone.querySelector('.titer-group')) {
                addNewTiterGroup(clone, type);
            }

            if (type === 'maternal') {
                clone.addEventListener('change', validateMaternalTiters);
            }

            // Attach event listeners to existing titer groups
            clone.querySelectorAll('.titer-group').forEach(group => {
                attachTiterEventListeners(group, type);
            });
        }
    });
}

function getLatestTiterId(tabId) {
    // Get the container for the specified tab and type (maternal or infant)
    const container = document.getElementById(`${tabId}maternalTiterContainer`);
    if (!container) return null;
    
    // Get all titer groups in this container
    const titerGroups = container.querySelectorAll('.titer-group');
    if (!titerGroups.length) return null;
    
    let latestDate = null;
    let latestTiterId = null;
    
    // Iterate through each titer group to find the latest one
    titerGroups.forEach((group, index) => {
        const dateInput = group.querySelector(`input[name="${tabId}_maternal_collection_date[]"]`);
        const titerSelect = group.querySelector(`select[name="${tabId}_maternal_titer[]"]`);
        
        if (dateInput && dateInput.value && titerSelect && titerSelect.value) {
            const currentDate = new Date(dateInput.value);
            
            // If this is the first valid date or it's later than our current latest
            if (latestDate === null || currentDate > latestDate) {
                latestDate = currentDate;
                // We can use the index as the ID, or create a more complex ID if needed
                latestTiterId = index;
                // Alternative: latestTiterId = `${tabId}_${type}_titer_${index}`;
            }
        }
    });
    
    return latestTiterId;
}

function getInfantTiterId() {
    // Get the active tab ID
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    
    // Return the ID in the format used in the form
    return `${activeTab}_infant_titer`;
}

// Treatment Selection
function selectTreatment(id) {
    // Get the active tab
    const activeTab = document.querySelector('.tab.active').dataset.tab;

    // Remove selected class from all options within the active tab
    document.querySelectorAll(`#${activeTab}-content .treatment-option`).forEach(option => {
        option.classList.remove('selected');
    });

    // Add selected class to clicked option within the active tab
    const clickedOption = document.querySelector(`#${activeTab}-content [onclick="selectTreatment('${id}')"]`);
    if (clickedOption) {
        clickedOption.classList.add('selected');
        // Find and check the radio input within the active tab
        const radioInput = document.getElementById(id);
        if (radioInput) {
            radioInput.checked = true;
            // Log for debugging
            console.log('Selected treatment:', id, radioInput.value);
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e, e.target.dataset.tab));
    });

    // Initialize with default tab
    const defaultTab = document.querySelector('.tab.active');
    if (defaultTab) {
        switchTab({ currentTarget: defaultTab }, 'conventional');
    }

    // Initialize all handlers
    initializeDateValidation();
    initializeRPRHandler();
    initializeTiterHandling();

    // Add tab change listener for titer handling
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setTimeout(initializeTiterHandling, 0);
        });
    });

    // Additional tab switching logic to ensure form validation works correctly
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.approach-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to the clicked tab
            this.classList.add('active');

            // Hide all contents
            contents.forEach(content => content.classList.remove('active'));
            // Show the content corresponding to the clicked tab
            const activeContent = document.getElementById(`${this.dataset.tab}-content`);
            activeContent.classList.add('active');

            // Ensure form validation works correctly
            const form = document.getElementById('sifiForm');
            form.noValidate = true; // Disable built-in validation temporarily
            form.noValidate = false; // Re-enable built-in validation
        });
    });

    // Initial required fields setup
    updateRequiredFields();
});

// Make functions globally available
window.selectTreatment = selectTreatment;
window.resetForm = resetForm;
window.switchTab = switchTab;