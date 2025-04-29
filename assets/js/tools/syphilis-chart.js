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
    console.log('infant data:', infantData);
    console.log('Maternal data:', maternalData);
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
        <div id="${activeTab}-titer-graph" style="width: 100%; height: 400px;"></div>
    `;
    
    // Add container after recommendations
    const recommendationsContainer = document.getElementById(`${activeTab}resultContainer`);
    if (recommendationsContainer) {
        recommendationsContainer.after(visualizationContainer);
    } else {
        console.error('Recommendations container not found');
        return;
    }
    console.log("All Data:", allData);
    console.log("Fourfold Value:", fourfoldValue);
    // Draw the graph after the container is added to the DOM
    setTimeout(() => {
        drawTable(allData, fourfoldValue);
    }, 0);
}

function drawTable(allData, fourfoldValue) {
    // Load the Google Charts visualization library
    google.charts.load('current', {'packages':['corechart']});
    
    // Set a callback to run when the Google Visualization API is loaded
    google.charts.setOnLoadCallback(drawChart);
    
    /**
     * Draw the chart with the provided data
     */
    function drawChart() {
        //Create data table for the chart
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        
        // Construct the correct graph container ID based on the active tab
        const graphContainerId = `${activeTab}-titer-graph`;
        const data = new google.visualization.DataTable();
        
        // Add columns
        data.addColumn('date', 'Date');
        data.addColumn('number', 'Maternal Titer');
        data.addColumn('number', 'Infant Titer');
        data.addColumn('number', 'Fourfold Line');
        
        // Sort data by date
        allData.sort(function(a, b) {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Group data by date
        const groupedData = {};
        for (let i = 0; i < allData.length; i++) {
            const item = allData[i];
            const dateStr = new Date(item.date).toISOString().split('T')[0];
            
            if (!groupedData[dateStr]) {
                groupedData[dateStr] = { 
                    date: new Date(item.date), 
                    maternal: null, 
                    infant: null 
                };
            }
            
            if (item.label.includes('Maternal')) {
                groupedData[dateStr].maternal = item.titer;
            } else if (item.label.includes('Infant')) {
                groupedData[dateStr].infant = item.titer;
            }
        }
        
        // Find min and max dates to set chart range
        const dates = [];
        for (const key in groupedData) {
            if (groupedData.hasOwnProperty(key)) {
                dates.push(groupedData[key].date);
            }
        }
        
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));
        
        // Add one week buffer on each side
        const chartMinDate = new Date(minDate);
        chartMinDate.setDate(chartMinDate.getDate() - 7);
        const chartMaxDate = new Date(maxDate);
        chartMaxDate.setDate(chartMaxDate.getDate() + 7);
        
        // Add rows to data table
        for (const key in groupedData) {
            if (groupedData.hasOwnProperty(key)) {
                const item = groupedData[key];
                data.addRow([
                    item.date,
                    item.maternal,
                    item.infant,
                    fourfoldValue
                ]);
            }
        }
        
        // Determine the maximum titer value to set y-axis scale
        let maxTiter = 1;
        for (let i = 0; i < allData.length; i++) {
            maxTiter = Math.max(maxTiter, allData[i].titer);
        }
        
        // Get ticks for y-axis
        const ticks = getTiterTicks(getNextTiterValue(maxTiter));
        
        // Create the chart options
        const options = {
            title: 'Titer Visualization',
            height: 400,
            legend: { position: 'bottom' },
            hAxis: {
                title: 'Date',
                format: 'MMM dd, yyyy',
                viewWindow: {
                    min: chartMinDate,
                    max: chartMaxDate
                }
            },
            vAxis: {
                title: 'Titer Value 1:Y',
                logScale: true,
                ticks: ticks,
                viewWindow: {
                    min: 0.5,
                    max: ticks[ticks.length - 1] * 2
                }
            },
            series: {
                0: { color: '#4CAF50', lineWidth: 3 }, // Maternal (Green for positive association)
                1: { color: '#FF9800', lineWidth: 3 }, // Infant (Orange for attention)
                2: { color: '#9C27B0', lineWidth: 2, lineDashStyle: [4, 4] } // Fourfold line (Purple for distinction)
            },
            interpolateNulls: true
        };
        
        // Create and draw the chart
        // use graphContainerId 

        const chartContainer = document.getElementById(graphContainerId);
        if (!chartContainer) {
            console.error('Chart container not found: ' + graphContainerId);
            return;
        }
        const chart = new google.visualization.LineChart(chartContainer);
        chart.draw(data, options);
    }
    
    /**
     * Get the next titer value in the standard dilution series
     * @param {Number} currentTiter - The current titer value
     * @returns {Number} - The next titer value
     */
    function getNextTiterValue(currentTiter) {
        const titerSeries = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        const currentIndex = titerSeries.indexOf(currentTiter);
        
        if (currentIndex >= 0 && currentIndex < titerSeries.length - 1) {
            return titerSeries[currentIndex + 1];
        } else if (currentTiter > titerSeries[titerSeries.length - 1]) {
            return currentTiter * 2;
        }
        
        return 256; // Default to 256 if the current titer isn't in the series
    }
    
    /**
     * Generate titer tick values for the chart's y-axis
     * @param {Number} maxTiter - The maximum titer value
     * @returns {Array} - Array of tick values
     */
    function getTiterTicks(maxTiter) {
        const standardTicks = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        return standardTicks.filter(function(tick) {
            return tick <= maxTiter;
        });
    }
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
window.addTiterVisualization = addTiterVisualization;