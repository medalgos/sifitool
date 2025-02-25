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
        <div id="${activeTab}-titer-graph" style="width: 100%; height: 400px; position: relative; margin-top: 20px;"></div>
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
        drawSimpleGraph(allData, fourfoldValue, latestMaternalTiter);
    }, 0);
}

function addTiterVisualization() {
    createTiterVisualization();
}

function drawSimpleGraph(data, fourfoldValue, latestMaternalTiter) {
    // Get the active tab ID
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    
    // Construct the correct graph container ID based on the active tab
    const graphContainerId = `${activeTab}-titer-graph`;
    const graphContainer = document.getElementById(graphContainerId);
    
    if (!graphContainer) {
        console.error(`Graph container with ID ${graphContainerId} not found.`);
        return;
    }
    
    // Clear any existing content
    graphContainer.innerHTML = '';
    
    // Graph dimensions
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;
    const padding = {top: 40, right: 40, bottom: 60, left: 80};
    
    // Get all dates and titers for scaling
    const allDates = data.map(d => d.date.getTime());
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    
    // Add buffer days on each side
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);
    
    // Create the SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.overflow = 'visible';
    graphContainer.appendChild(svg);
    
    // X scale (date)
    const xScale = (date) => {
        return padding.left + (date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime()) * (width - padding.left - padding.right);
    };
    
    // Y scale (titer) - logarithmic scale for titers
    const titers = [1, 2, 4, 8, 16, 32, 64, 128, 256];
    const yScale = (titer) => {
        const logTiter = Math.log2(titer);
        const maxLogTiter = Math.log2(256);
        return height - padding.bottom - (logTiter / maxLogTiter) * (height - padding.top - padding.bottom);
    };
    
    // Draw axes
    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', padding.left);
    xAxis.setAttribute('y1', height - padding.bottom);
    xAxis.setAttribute('x2', width - padding.right);
    xAxis.setAttribute('y2', height - padding.bottom);
    xAxis.setAttribute('stroke', 'black');
    xAxis.setAttribute('stroke-width', 1);
    svg.appendChild(xAxis);
    
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', padding.left);
    yAxis.setAttribute('y1', padding.top);
    yAxis.setAttribute('x2', padding.left);
    yAxis.setAttribute('y2', height - padding.bottom);
    yAxis.setAttribute('stroke', 'black');
    yAxis.setAttribute('stroke-width', 1);
    svg.appendChild(yAxis);
    
    // Add X-axis labels (dates)
    const dateRange = maxDate.getTime() - minDate.getTime();
    const dayInMs = 86400000; // milliseconds in a day
    
    // Determine a good interval for date ticks
    let dateInterval;
    if (dateRange <= 14 * dayInMs) {
        dateInterval = 2 * dayInMs; // 2 days
    } else if (dateRange <= 60 * dayInMs) {
        dateInterval = 7 * dayInMs; // 1 week
    } else {
        dateInterval = 30 * dayInMs; // 1 month
    }
    
    // Create date ticks
    for (let t = minDate.getTime(); t <= maxDate.getTime(); t += dateInterval) {
        const tickDate = new Date(t);
        const x = xScale(tickDate);
        
        // Tick mark
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x);
        tick.setAttribute('y1', height - padding.bottom);
        tick.setAttribute('x2', x);
        tick.setAttribute('y2', height - padding.bottom + 5);
        tick.setAttribute('stroke', 'black');
        tick.setAttribute('stroke-width', 1);
        svg.appendChild(tick);
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height - padding.bottom + 20);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12px');
        label.textContent = formatDate(tickDate);
        svg.appendChild(label);
    }
    
    // Add Y-axis labels (titer values)
    titers.forEach(titer => {
        const y = yScale(titer);
        
        // Tick mark
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', padding.left - 5);
        tick.setAttribute('y1', y);
        tick.setAttribute('x2', padding.left);
        tick.setAttribute('y2', y);
        tick.setAttribute('stroke', 'black');
        tick.setAttribute('stroke-width', 1);
        svg.appendChild(tick);
        
        // Grid line
        const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        gridLine.setAttribute('x1', padding.left);
        gridLine.setAttribute('y1', y);
        gridLine.setAttribute('x2', width - padding.right);
        gridLine.setAttribute('y2', y);
        gridLine.setAttribute('stroke', '#e0e0e0');
        gridLine.setAttribute('stroke-width', 1);
        svg.appendChild(gridLine);
        
        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', padding.left - 10);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '12px');
        label.textContent = `1:${titer}`;
        svg.appendChild(label);
    });
    
    // Add axis titles
    // X-axis title
    const xAxisTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisTitle.setAttribute('x', width / 2);
    xAxisTitle.setAttribute('y', height - 10);
    xAxisTitle.setAttribute('text-anchor', 'middle');
    xAxisTitle.setAttribute('font-size', '14px');
    xAxisTitle.textContent = 'Date';
    svg.appendChild(xAxisTitle);
    
    // Y-axis title
    const yAxisTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisTitle.setAttribute('x', -height / 2);
    yAxisTitle.setAttribute('y', 20);
    yAxisTitle.setAttribute('text-anchor', 'middle');
    yAxisTitle.setAttribute('font-size', '14px');
    yAxisTitle.setAttribute('transform', 'rotate(-90)');
    yAxisTitle.textContent = 'Titer Value';
    svg.appendChild(yAxisTitle);
    
    // Draw fourfold line if available
    if (fourfoldValue && latestMaternalTiter) {
        const y = yScale(fourfoldValue);
        
        const fourfoldLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        fourfoldLine.setAttribute('x1', padding.left);
        fourfoldLine.setAttribute('y1', y);
        fourfoldLine.setAttribute('x2', width - padding.right);
        fourfoldLine.setAttribute('y2', y);
        fourfoldLine.setAttribute('stroke', 'purple');
        fourfoldLine.setAttribute('stroke-width', 2);
        fourfoldLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(fourfoldLine);
        
        // Add label for fourfold line
        const fourfoldLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        fourfoldLabel.setAttribute('x', width - padding.right);
        fourfoldLabel.setAttribute('y', y - 5);
        fourfoldLabel.setAttribute('text-anchor', 'end');
        fourfoldLabel.setAttribute('font-size', '12px');
        fourfoldLabel.setAttribute('fill', 'purple');
        fourfoldLabel.textContent = `Fourfold (1:${fourfoldValue})`;
        svg.appendChild(fourfoldLabel);
    }
    
    // Group data by type (maternal vs infant)
    const maternalData = data.filter(d => d.label.includes('Maternal'));
    const infantData = data.filter(d => d.label.includes('Infant'));
    
    // Draw maternal data points and connect with line
    if (maternalData.length > 0) {
        // Draw lines connecting points
        let pathData = `M ${xScale(maternalData[0].date)} ${yScale(maternalData[0].titer)}`;
        for (let i = 1; i < maternalData.length; i++) {
            pathData += ` L ${xScale(maternalData[i].date)} ${yScale(maternalData[i].titer)}`;
        }
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'steelblue');
        path.setAttribute('stroke-width', 2);
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
        
        // Draw points
        maternalData.forEach(d => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xScale(d.date));
            circle.setAttribute('cy', yScale(d.titer));
            circle.setAttribute('r', 5);
            circle.setAttribute('fill', 'steelblue');
            
            // Add tooltip behavior
            circle.setAttribute('data-tooltip', `Maternal Titer: 1:${d.titer} (${formatDate(d.date)})`);
            circle.addEventListener('mouseover', showTooltip);
            circle.addEventListener('mouseout', hideTooltip);
            
            svg.appendChild(circle);
        });
    }
    
    // Draw infant data points
    if (infantData.length > 0) {
        infantData.forEach(d => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', xScale(d.date));
            circle.setAttribute('cy', yScale(d.titer));
            circle.setAttribute('r', 5);
            circle.setAttribute('fill', 'crimson');
            
            // Add tooltip behavior
            circle.setAttribute('data-tooltip', `Infant Titer: 1:${d.titer} (${formatDate(d.date)})`);
            circle.addEventListener('mouseover', showTooltip);
            circle.addEventListener('mouseout', hideTooltip);
            
            svg.appendChild(circle);
        });
    }
    
    // Add legend
    const legendY = padding.top / 2;
    
    // Maternal legend item
    if (maternalData.length > 0) {
        const legendCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        legendCircle.setAttribute('cx', padding.left + 10);
        legendCircle.setAttribute('cy', legendY);
        legendCircle.setAttribute('r', 5);
        legendCircle.setAttribute('fill', 'steelblue');
        svg.appendChild(legendCircle);
        
        const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legendText.setAttribute('x', padding.left + 20);
        legendText.setAttribute('y', legendY + 4);
        legendText.setAttribute('font-size', '12px');
        legendText.textContent = 'Maternal Titers';
        svg.appendChild(legendText);
    }
    
    // Infant legend item
    if (infantData.length > 0) {
        const legendCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        legendCircle.setAttribute('cx', padding.left + 120);
        legendCircle.setAttribute('cy', legendY);
        legendCircle.setAttribute('r', 5);
        legendCircle.setAttribute('fill', 'crimson');
        svg.appendChild(legendCircle);
        
        const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legendText.setAttribute('x', padding.left + 130);
        legendText.setAttribute('y', legendY + 4);
        legendText.setAttribute('font-size', '12px');
        legendText.textContent = 'Infant Titer';
        svg.appendChild(legendText);
    }
    
    // Fourfold legend item if applicable
    if (fourfoldValue) {
        const legendLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        legendLine.setAttribute('x1', padding.left + 220);
        legendLine.setAttribute('y1', legendY);
        legendLine.setAttribute('x2', padding.left + 240);
        legendLine.setAttribute('y2', legendY);
        legendLine.setAttribute('stroke', 'purple');
        legendLine.setAttribute('stroke-width', 2);
        legendLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(legendLine);
        
        const legendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        legendText.setAttribute('x', padding.left + 250);
        legendText.setAttribute('y', legendY + 4);
        legendText.setAttribute('font-size', '12px');
        legendText.textContent = 'Fourfold from latest maternal titer';
        svg.appendChild(legendText);
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'titer-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '8px';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.borderRadius = '4px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.2s';
    tooltip.style.zIndex = '1000';
    graphContainer.appendChild(tooltip);
}

// Tooltip functions
function showTooltip(event) {
    const tooltip = document.getElementById('titer-tooltip');
    if (!tooltip) return;
    
    tooltip.textContent = event.target.getAttribute('data-tooltip');
    tooltip.style.opacity = '1';
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY - 20}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('titer-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
    }
}

// Helper function to format dates
function formatDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Function to add visualization after recommendations
// function addTiterVisualization() {
//     // Remove any existing visualization first
//     clearTiterVisualization();
    
//     // Then create a new one
//     createTiterVisualization();
// }

function clearTiterVisualization() {
    const existingVisualization = document.getElementById('titer-visualization-container');
    if (existingVisualization) {
        existingVisualization.remove();
    }
}

// Export functions for use in other files
window.handleReverseSequenceSubmit = handleReverseSequenceSubmit;
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
