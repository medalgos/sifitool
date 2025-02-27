function isFourfoldOrGreater(infantTiter, maternalTiter) {
    // Convert titers to numeric values
    const getNumericTiter = (titer) => {
        if (typeof titer === 'number') return titer;
        return parseInt(titer.split(':')[1] || titer);
    };

    const infantValue = getNumericTiter(infantTiter);
    const maternalValue = getNumericTiter(maternalTiter);

    return infantValue >= maternalValue * 4;
}

// Main function to determine outcome--------------------------------------------------------------
function determineReverseSequenceOutcome(formData) {
    const {
        rprResult,              // maternal RPR/VDRL result
        treponemalTest,         // treponemal test result
        treatmentHistory,       // treatment history
        infantTiter,            // infant's titer
        maternalTiter,         // maternal titer
        infantExam             // infant examination result
    } = formData;

    // Non-reactive RPR with non-reactive treponemal test
    if (rprResult === 'nonreactive' && treponemalTest === 'nonreactive') {
        return 4;
    }

    // Check titer comparison
    // if maternal or infant titer null return 6 
    if (!maternalTiter || !infantTiter || !infantExam) {
        return 6;
    }
    const isFourfoldGreaterTiter = isFourfoldOrGreater(infantTiter, maternalTiter);

    // Scenarios for both reactive RPR or reactive treponemal test
    if (rprResult === 'reactive' || treponemalTest === 'reactive') {
        // Adequate treatment before pregnancy
        if (treatmentHistory === 'adequate-before') {
            return 3;
        }

        // Adequate treatment during pregnancy
        if (treatmentHistory === 'adequate-during') {
            if (isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 2;
            }

            if (infantExam === 'abnormal') {
                return 0;
            }
        }

        // Inadequate treatment
        if (treatmentHistory === 'inadequate') {
            if (infantExam === 'abnormal' || isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 1;
            }
        }
    }

    return 6;
}

// Conventional Approach ---------------------------------------------------------------------------------------------------
function determineConventionalOutcome(formData) {
    const {             
        treponemalTest,         // treponemal test result
        treatmentHistory,       // treatment history
        infantTiter,            // infant's titer
        maternalTiter,          // maternal titer
        infantExam              // infant examination result
    } = formData;

    // Check titer comparison
    // if maternal or infant titer null return 6 
    const isFourfoldGreaterTiter = isFourfoldOrGreater(infantTiter, maternalTiter);
    if(treponemalTest === 'nonreactive') {
        return 5;
    }
    // Scenarios for both reactive RPR or reactive treponemal test
    if (treponemalTest === 'reactive') {
        // Adequate treatment before pregnancy
        if (treatmentHistory === 'adequate-before') {
            return 3;
        }

        // Adequate treatment during pregnancy
        if (treatmentHistory === 'adequate-during') {
            if (isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 2;
            }

            if (infantExam === 'abnormal') {
                return 0;
            }
        }

        // Inadequate treatment
        if (treatmentHistory === 'inadequate') {
            if (infantExam === 'abnormal' || isFourfoldGreaterTiter) {
                return 0;
            }

            if (infantExam === 'normal' && !isFourfoldGreaterTiter) {
                return 1;
            }
        }
    }

    return 6;
}

// Export functions for use in other files
window.determineConventionalOutcome = determineConventionalOutcome;



// Function to get additional recommendations from results data
async function getRecommendations(outcomeId) {
    try {
        const response = await fetch('results.json');
        const data = await response.json();
        
        // Find matching category by ID instead of name
        const category = data.categories.find(cat => cat.id === outcomeId);

        if (category) {
            const recommendations = {
                name: category.name
            };

            if (category.findings) {
                recommendations.findings = category.findings;
            }

            if (category.recommended_evaluation) {
                recommendations.evaluation = category.recommended_evaluation;
            }

            if (category.treatment) {
                recommendations.treatments = category.treatment;
            }

            return recommendations;
        }

        // Return default/error state if category not found
        return {
            name: "Unable to determine category",
            findings: [],
            evaluation: [],
            treatments: []
        };

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        // Return default/error state
        return {
            name: "Error retrieving recommendations",
            findings: [],
            evaluation: [],
            treatments: []
        };
    }
}



// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('sifiForm');
    // if (!form.checkValidity()) {
    //     // Trigger browser's validation UI
    //     form.reportValidity();
    //     return; // Stop processing if validation fails
    // }
    clearTiterVisualization();
    try {
        // Get the active tab
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        
        // Process titer information
        const { latestMaternalTiter, latestInfantTiter } = processTiterInformation(activeTab);
        
        // Get treatment history
        const treatmentHistoryInput = document.querySelector(`input[name="${activeTab}treatmentHistory"]:checked`);
        console.log('Treatment history input:', treatmentHistoryInput);
        
        // Log for debugging
        //console.log('Treatment history input:', treatmentHistoryInput);
        //console.log('Treatment history value:', treatmentHistoryInput?.value);
        //console.log('Latest maternal titer:', latestMaternalTiter);
       // console.log('Latest infant titer:', latestInfantTiter);
        
       const formData = {
        rprResult: document.getElementById(`${activeTab}rprResult`)?.value ?? null,
        treponemalTest: document.getElementById(`${activeTab}treponemalTest`)?.value ?? null,
        treatmentHistory: document.querySelector(`input[name="${activeTab}_treatmentHistory"]:checked`)?.value ?? null,
        infantTiter: latestInfantTiter,
        maternalTiter: latestMaternalTiter,
        infantExam: document.getElementById(`${activeTab}infantExam`)?.value ?? null
        };
        
        // Log entire form data for debugging
        console.log('Form Data:', formData);

        // Determine outcome based on the active tab
        let outcome;
        if (activeTab === 'conventional') {
            outcome = determineConventionalOutcome(formData);
            console.log('Conventional outcome:', outcome);
        } else if (activeTab === 'reverse') {
            outcome = determineReverseSequenceOutcome(formData);
            console.log('Reverse outcome:', outcome);
        }
        
        console.log('Outcome:', outcome);
        const fullRecommendations = await getRecommendations(outcome);
        console.log(fullRecommendations);
        displayRecommendations(fullRecommendations);
        addTiterVisualization();
        // diagram(formdata)

    } catch (error) {
        console.error('Form submission error:', error);
    }
}

// Export functions for use in other files
window.handleFormSubmit = handleFormSubmit;
window.clearTiterVisualization = clearTiterVisualization;


// function displayResults(result) {
//     const resultsDiv = document.getElementById('reverseresultContainer');
    
//     if (result.outcome === 'Validation Error') {
//         // Display validation error with details
//         resultsDiv.innerHTML = `
//             <div class="error">
//                 <h3>${result.outcome}</h3>
//                 <p>${result.details}</p>
//             </div>
//         `;
//     } else {}};

function displayRecommendations(recommendations) {
    // Get the active tab
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    
    // Determine the correct result container based on the active tab
    const resultContainerId = activeTab === 'conventional' ? 'conventionalresultContainer' : 'reverseresultContainer';
    const resultContainer = document.getElementById(resultContainerId);

    if (!resultContainer) {
        console.error("Error: resultContainer not found in the DOM.");
        return;
    }

    console.log("Displaying recommendations:", recommendations);

    // Ensure properties are formatted correctly
    const findings = Array.isArray(recommendations.findings)
        ? recommendations.findings.map(finding => `<li>${finding}</li>`).join('')
        : "<li>No specific findings.</li>";

    const evaluation = recommendations.evaluation 
        ? `<li>${recommendations.evaluation}</li>`
        : "<li>No specific evaluation recommendations.</li>";

    const treatments = Array.isArray(recommendations.treatments)
        ? recommendations.treatments.map(treatment => {
            if (typeof treatment === "object" && treatment !== null) {
                // Extract the key-value pair dynamically
                const key = Object.keys(treatment)[0];  // Get the key (e.g., "none_required", "optional")
                const value = treatment[key];  // Get the corresponding value
                return `<li><strong>${key.replace(/_/g, ' ')}</strong>: ${value}</li>`;
            }
            return `<li>${treatment}</li>`;
        }).join('')
        : "<li>No specific treatment recommendations.</li>";

    // Update the container with structured HTML
    resultContainer.innerHTML = `
        <div style="border: 2px solid #333; padding: 15px; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="color: #007BFF;">${recommendations.name || "No Recommendation Available"}</h2>
            <h3>Findings:</h3>
            <ul>${findings}</ul>
            <h3>Recommended Evaluation:</h3>
            <ul>${evaluation}</ul>
            <h3>Treatment:</h3>
            <ul>${treatments}</ul>
        </div>
    `;
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
        const dateInput = group.querySelector('input[id^="' + activeTab + '_maternal_collection_date"]');
        const titerSelect = group.querySelector('select[id^="' + activeTab + '_maternal_titer"]');
        
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


// Visualization ----------------------------------------------------------------------------------------------------------
function createTiterVisualization() {
    // Clear any existing visualization first
    clearTiterVisualization();
    
    // Get the active tab ID
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    console.log('Active tab:', activeTab);

    // Get maternal titers container
    const maternalContainer = document.getElementById(`${activeTab}maternalTiterContainer`);
    const infantContainer = document.getElementById(`${activeTab}infantTiterContainer`);

    console.log('Maternal container:', maternalContainer);
    console.log('Infant container:', infantContainer);

    if (!maternalContainer || !infantContainer) {
        console.error('Titer containers not found');
        return;
    }

    // Collect maternal titer data
    const maternalData = [];
    const maternalGroups = maternalContainer.querySelectorAll('.titer-group');
    console.log('Found maternal groups:', maternalGroups.length);
    if (maternalGroups.length === 0){
        console.error('No maternal groups found')
        return;
    } 

    maternalGroups.forEach((group, index) => {
        const titerSelect = group.querySelector('select[id^="' + activeTab + '_maternal_titer"]');
        const dateInput = group.querySelector('input[id^="' + activeTab + '_maternal_collection_date"]');
        
        console.log(`Group ${index} titer:`, titerSelect);
        console.log(`Group ${index} date:`, dateInput);
        
        if (titerSelect && titerSelect.value && dateInput && dateInput.value) {
            maternalData.push({
                date: new Date(dateInput.value),
                titer: parseInt(titerSelect.value),
                label: `Maternal (${dateInput.value})`
            });
            console.log(`Added maternal data point: ${dateInput.value}, ${titerSelect.value}`);
        }
    });

    // Sort maternal data by date
    maternalData.sort((a, b) => a.date - b.date);
    console.log('Sorted maternal data:', maternalData);

    // Get infant titer data
    const infantData = [];
    const infantGroups = infantContainer.querySelectorAll('.titer-group');
    console.log('Found infant groups:', infantGroups.length);

    infantGroups.forEach((group, index) => {
        const titerSelect = group.querySelector('select[id^="' + activeTab + '_infant_titer"]');
        const dateInput = group.querySelector('input[id^="' + activeTab + '_infant_collection_date"]');
        
        console.log(`Infant group ${index} titer:`, titerSelect);
        console.log(`Infant group ${index} date:`, dateInput);
        
        if (titerSelect && titerSelect.value && dateInput && dateInput.value) {
            infantData.push({
                date: new Date(dateInput.value),
                titer: parseInt(titerSelect.value),
                label: `Infant (${dateInput.value})`
            });
            console.log(`Added infant data point: ${dateInput.value}, ${titerSelect.value}`);
        }
    });
    
    // Combine all data points for plotting
    const allData = [...maternalData, ...infantData];
    
    if (allData.length === 0) {
        return;
    }
    
    // Find the latest maternal titer for fourfold calculation
    let latestMaternalTiter = null;
    if (maternalData.length > 0) {
        latestMaternalTiter = maternalData[maternalData.length - 1];
    }
    
    // Calculate fourfold value if we have a latest maternal titer
    let fourfoldValue = null;
    if (latestMaternalTiter) {
        fourfoldValue = latestMaternalTiter.titer / 4;
    }
    
    // Create visualization container
    const visualizationContainer = document.createElement('div');
    visualizationContainer.id = 'titer-visualization-container';
    visualizationContainer.className = 'results-container';
    
    // Create canvas for the graph
    visualizationContainer.innerHTML = `
        <h3>Titer Visualization</h3>
        <canvas id="${activeTab}-titer-graph" style="width: 100%; height: 400px;"></canvas>
    `;
    
    // Add container after recommendations
    const recommendationsContainer = document.getElementById(`${activeTab}resultContainer`);
    if (recommendationsContainer) {
        recommendationsContainer.after(visualizationContainer);
    } else {
        console.error('Recommendations container not found');
        return;
    }
    
    // Draw the graph after the container is added to the DOM
    setTimeout(() => {
        drawChart(allData, fourfoldValue, latestMaternalTiter);
    }, 0);
}

function drawChart(data, fourfoldValue, latestMaternalTiter) {
    // Get the active tab ID
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    
    // Construct the correct graph container ID based on the active tab
    const graphContainerId = `${activeTab}-titer-graph`;
    const ctx = document.getElementById(graphContainerId).getContext('2d');
    
    // Group data by type (maternal vs infant)
    const maternalData = data.filter(d => d.label.includes('Maternal'));
    const infantData = data.filter(d => d.label.includes('Infant'));
    
    // Prepare data for Chart.js
    const chartData = {
        labels: data.map(d => d.date.toLocaleDateString()),
        datasets: [
            {
                label: 'Maternal Titers',
                data: maternalData.map(d => d.titer),
                borderColor: 'steelblue',
                backgroundColor: 'steelblue',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Infant Titers',
                data: infantData.map(d => d.titer),
                borderColor: 'crimson',
                backgroundColor: 'crimson',
                fill: false,
                tension: 0.1
            }
        ]
    };
    
    // Add fourfold line if applicable
    if (fourfoldValue) {
        chartData.datasets.push({
            label: 'Fourfold from latest maternal titer',
            data: new Array(data.length).fill(fourfoldValue),
            borderColor: 'purple',
            backgroundColor: 'purple',
            borderDash: [5, 5],
            fill: false,
            tension: 0.1
        });
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Titer Value'
                    },
                    ticks: {
                        callback: function(value) {
                            return '1:' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: 1:${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function addTiterVisualization() {
    createTiterVisualization();
}

function clearTiterVisualization() {
    const existingVisualization = document.getElementById('titer-visualization-container');
    if (existingVisualization) {
        existingVisualization.remove();
    }
}

// Export functions for use in other files
window.clearTiterVisualization = clearTiterVisualization;

function processTiterInformation(activeTab) {
    const maternalContainer = document.getElementById(`${activeTab}maternalTiterContainer`);
    const infantContainer = document.getElementById(`${activeTab}infantTiterContainer`);
    
    // Get all maternal titer data and sort by date
    const maternalData = [];
    const maternalGroups = maternalContainer.querySelectorAll('.titer-group');
    console.log('Found maternal groups:', maternalGroups.length);
    
    maternalGroups.forEach((group, index) => {
        // More specific selectors that don't rely on name attribute patterns
        const titerSelect = group.querySelector(`select[id^="${activeTab}_maternal_titer"]`);
        const dateInput = group.querySelector(`input[id^="${activeTab}_maternal_collection_date"]`);
        
        console.log(`Group ${index} titer:`, titerSelect);
        console.log(`Group ${index} date:`, dateInput);
        
        if (titerSelect && titerSelect.value && dateInput && dateInput.value) {
            maternalData.push({
                date: new Date(dateInput.value),
                titer: parseInt(titerSelect.value),
                label: `Maternal (${dateInput.value})`
            });
            console.log(`Added maternal data point: ${dateInput.value}, ${titerSelect.value}`);
        }
    });
    
    // Sort maternal data by date
    maternalData.sort((a, b) => a.date - b.date);
    console.log('Sorted maternal data:', maternalData);
    
    // Get the latest maternal titer (last element after sorting)
    const latestMaternalTiter = maternalData.length > 0 ? maternalData[maternalData.length - 1].titer : '';
    
    // Do the same for infant titers
    const infantData = [];
    const infantGroups = infantContainer.querySelectorAll('.titer-group');
    console.log('Found infant groups:', infantGroups.length);
    
    infantGroups.forEach((group, index) => {
        const titerSelect = group.querySelector(`select[id^="${activeTab}_infant_titer"]`);
        const dateInput = group.querySelector(`input[id^="${activeTab}_infant_collection_date"]`);
        
        if (titerSelect && titerSelect.value && dateInput && dateInput.value) {
            infantData.push({
                date: new Date(dateInput.value),
                titer: parseInt(titerSelect.value),
                label: `Infant (${dateInput.value})`
            });
            console.log(`Added infant data point: ${dateInput.value}, ${titerSelect.value}`);
        }
    });
    
    // Sort infant data by date
    infantData.sort((a, b) => a.date - b.date);
    console.log('Sorted infant data:', infantData);
    
    // Get the latest infant titer
    const latestInfantTiter = infantData.length > 0 ? infantData[infantData.length - 1].titer : '';
    
    return {
        latestMaternalTiter,
        latestInfantTiter
    };
}
