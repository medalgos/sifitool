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
    
    // Draw the graph after the container is added to the DOM
    setTimeout(() => {
        drawChart(allData, fourfoldValue, latestMaternalTiter);
    }, 0);
}

function drawChart(data, fourfoldValue, latestMaternalTiter) {
    // Load Google Charts
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(() => {
        // Get the active tab ID
        const activeTab = document.querySelector('.tab.active').dataset.tab;
        
        // Construct the correct graph container ID based on the active tab
        const graphContainerId = `${activeTab}-titer-graph`;
        
        // Group data by type (maternal vs infant)
        const maternalData = data.filter(d => d.label.includes('Maternal'));
        const infantData = data.filter(d => d.label.includes('Infant'));
        
        // Create a data table
        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn('date', 'Date');
        dataTable.addColumn('number', 'Maternal Titers');
        dataTable.addColumn('number', 'Infant Titers');
        
        // Add rows to the data table
        maternalData.forEach(d => {
            dataTable.addRow([d.date, d.titer, null]);
        });
        infantData.forEach(d => {
            dataTable.addRow([d.date, null, d.titer]);
        });
        
        // Define chart options
        var options = {
            title: 'Titer Visualization',
            curveType: 'function', // Smooth curves instead of straight lines
            lineWidth: 3,
            pointSize: 5,
            colors: ['steelblue', 'crimson'], // Colors for the two lines
            hAxis: {
                title: 'Date',
                titleTextStyle: {
                    color: '#333',
                    fontSize: 14,
                    italic: false
                },
                format: 'MMM dd, yyyy', // Format the x-axis as dates
                viewWindow: {
                    min: new Date(data[0].date.getTime() - (24 * 60 * 60 * 1000)), // Add one day padding to the start
                    max: new Date(data[data.length - 1].date.getTime() + (24 * 60 * 60 * 1000)) // Add one day padding to the end
                }
            },
            vAxis: {
                title: 'Titer Value',
                titleTextStyle: {
                    color: '#333',
                    fontSize: 14,
                    italic: false
                },
                logScale: true, // Use log scale to evenly space powers of 2
                minValue: 1,
                maxValue: 256,
                ticks: [1, 2, 4, 8, 16, 32, 64, 128, 256] // Our specific tick values
            },
            legend: {
                position: 'top'
            },
            backgroundColor: {
                fill: 'white'
            },
            chartArea: {
                width: '80%',
                height: '70%'
            },
            tooltip: {
                textStyle: {
                    fontSize: 14
                }
            },
            animation: {
                startup: true,
                duration: 1000,
                easing: 'out'
            }
        };
        
        // Create and draw the chart
        var chart = new google.visualization.LineChart(document.getElementById(graphContainerId));
        chart.draw(dataTable, options);
        
        // Add a horizontal line for the fourfold value if applicable
        if (fourfoldValue) {
            var fourfoldLine = new google.visualization.DataTable();
            fourfoldLine.addColumn('date', 'Date');
            fourfoldLine.addColumn('number', 'Fourfold Line');
            data.forEach(d => {
                fourfoldLine.addRow([d.date, fourfoldValue]);
            });
            var combinedData = google.visualization.data.join(dataTable, fourfoldLine, 'full', [[0, 0]], [1, 2], [1]);
            options.series = {
                0: { color: 'steelblue' },
                1: { color: 'crimson' },
                2: { color: 'purple', lineDashStyle: [4, 4] }
            };
            chart.draw(combinedData, options);
        } else {
            chart.draw(dataTable, options);
        }
        
        // Make chart responsive
        window.addEventListener('resize', function() {
            chart.draw(dataTable, options);
        });
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
window.addTiterVisualization = addTiterVisualization;