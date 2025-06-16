document.addEventListener('DOMContentLoaded', () => {
    let chart = null;
    let allTransactions = [];

    // Color palette
    const colorPalette = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];

    // Get the visualizations section
    const visualizationsSection = document.getElementById('visualizations');
    
    // Clear existing content and rebuild with proper structure
    visualizationsSection.innerHTML = '';
    
    // Add dashboard header 
    const dashboardHeader = document.createElement('div');
    dashboardHeader.className = 'dashboard-header';
    dashboardHeader.innerHTML = `
        <h1 class="dashboard-title">Financial Analytics Dashboard</h1>
        <p class="dashboard-subtitle">Transaction insights and trends visualization</p>
    `;
    visualizationsSection.appendChild(dashboardHeader);

    // Create stats grid 
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    statsGrid.id = 'statsGrid';
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">0</div>
            <div class="stat-label">Total Transactions</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">0.0M</div>
            <div class="stat-label">Total Amount (RWF)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">0</div>
            <div class="stat-label">Avg Transaction</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">0</div>
            <div class="stat-label">Categories</div>
        </div>
    `;
    visualizationsSection.appendChild(statsGrid);

    // Create filter container 
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.innerHTML = `
        <label for="yearFilter">Select Time Period:</label>
        <select id="yearFilter">
            <option value="all">All Time</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
        </select>
    `;
    visualizationsSection.appendChild(filterContainer);

    // Create chart container 
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = `
        <div class="chart-header">
            <h2 class="chart-title" id="chartTitle">Transaction Overview</h2>
            <p class="chart-subtitle" id="chartSubtitle">Financial activity breakdown</p>
        </div>
        <div class="loading-overlay" id="loadingOverlay">
            <div class="spinner"></div>
        </div>
        <canvas id="chartContainer"></canvas>
        <div id="noDataMessage" style="display: none;">
            <div class="no-data-icon">📊</div>
            <div class="no-data-text">No Data Available</div>
            <div class="no-data-subtext">Try selecting a different time period</div>
        </div>
    `;
    visualizationsSection.appendChild(chartContainer);

    // Get references to all elements
    const yearFilter = document.getElementById('yearFilter');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const chartTitle = document.getElementById('chartTitle');
    const chartSubtitle = document.getElementById('chartSubtitle');
    const chartCanvas = document.getElementById('chartContainer');
    const noDataMessage = document.getElementById('noDataMessage');

    // Show loading initially
    loadingOverlay.style.display = 'flex';

    // Function to update statistics
    function updateStats() {
        const selectedYear = yearFilter.value;
        let filteredData = allTransactions;

        if (selectedYear !== 'all') {
            const year = parseInt(selectedYear);
            filteredData = allTransactions.filter(t => {
                try {
                    const date = new Date(t.date);
                    return !isNaN(date.getTime()) && date.getFullYear() === year;
                } catch {
                    return false;
                }
            });
        }

        const totalTransactions = filteredData.length;
        const totalAmount = filteredData.reduce((sum, t) => sum + t.amount, 0);
        const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        const uniqueCategories = new Set(filteredData.map(t => t.type)).size;

        // Update stat cards
        const statCards = statsGrid.querySelectorAll('.stat-card .stat-value');
        statCards[0].textContent = totalTransactions.toLocaleString();
        statCards[1].textContent = (totalAmount / 1000000).toFixed(1) + 'M';
        statCards[2].textContent = avgTransaction.toLocaleString('en-US', {maximumFractionDigits: 0});
        statCards[3].textContent = uniqueCategories;
    }

    // Fetch data with enhanced error handling
    fetch('http://127.0.0.1:5000/api/transactions')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allTransactions = data;
            console.log('All transactions:', allTransactions);
            loadingOverlay.style.display = 'none';
            updateStats();
            initializeChart();
        })
        .catch(error => {
            console.error('Fetch error:', error);
            loadingOverlay.style.display = 'none';
            
            // Show error in the chart area
            noDataMessage.innerHTML = `
                <div class="no-data-icon">⚠️</div>
                <div class="no-data-text">Error Loading Data</div>
                <div class="no-data-subtext">Please check your connection and try again</div>
            `;
            noDataMessage.style.display = 'block';
            chartCanvas.style.display = 'none';
        });

    // Event listener for year filter
    yearFilter.addEventListener('change', () => {
        updateStats();
        initializeChart();
    });

    function initializeChart() {
        const ctx = chartCanvas.getContext('2d');

        // Destroy existing chart if it exists
        if (chart) {
            chart.destroy();
            chart = null;
        }

        const selectedYear = yearFilter.value;
        const categories = [
            'Payments to Code Holders',
            'Incoming Money',
            'Transfers to Mobile Numbers',
            'Bank Deposits',
            'Airtime Bill Payments',
            'Cash Power Bill Payments',
            'Transactions Initiated by Third Parties',
            'Withdrawals from Agents',
            'Bank Transfers',
            'Internet and Voice Bundle Purchases'
        ];

        // Update chart titles
        if (selectedYear === 'all') {
            chartTitle.textContent = 'Transaction Overview - All Years';
            chartSubtitle.textContent = 'Transaction categories across different years';
        } else {
            chartTitle.textContent = `Transaction Overview - ${selectedYear}`;
            chartSubtitle.textContent = `Monthly breakdown for ${selectedYear} (Click on any legend to hide or show categories)`;
        }

        // Check if we have data for the selected year
        if (selectedYear !== 'all') {
            const year = parseInt(selectedYear);
            const hasDataForYear = allTransactions.some(t => {
                try {
                    const date = new Date(t.date);
                    return !isNaN(date.getTime()) && date.getFullYear() === year;
                } catch {
                    return false;
                }
            });

            if (!hasDataForYear) {
                // Show no data message in chart area
                noDataMessage.style.display = 'block';
                chartCanvas.style.display = 'none';
                return;
            }
        }

        // If we get here, we have data to display
        noDataMessage.style.display = 'none';
        chartCanvas.style.display = 'block';

        let labels, data, xAxisTitle;

        if (selectedYear === 'all') {
            // All Time: Categories vs Years
            labels = categories;
            xAxisTitle = 'Transaction Categories';
            data = [2023, 2024, 2025].map((year, index) => {
                const yearData = allTransactions.filter(t => {
                    try {
                        const date = new Date(t.date);
                        return !isNaN(date.getTime()) && date.getFullYear() === year;
                    } catch {
                        return false;
                    }
                });
                console.log(`Year ${year} data count:`, yearData.length);
                
                return {
                    label: year.toString(),
                    data: categories.map(category => {
                        return yearData
                            .filter(t => t.type === category)
                            .reduce((sum, t) => sum + t.amount, 0);
                    }),
                    backgroundColor: colorPalette[index],
                    borderColor: colorPalette[index],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                };
            });
        } else {
            // Specific Year: Categories vs Months
            const year = parseInt(selectedYear);
            labels = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1).toLocaleString('default', { month: 'short' }));
            xAxisTitle = 'Months';
            data = categories.map((category, index) => {
                return {
                    label: category,
                    data: labels.map((_, month) => {
                        return allTransactions
                            .filter(t => {
                                try {
                                    const date = new Date(t.date);
                                    return t.type === category && 
                                           !isNaN(date.getTime()) && 
                                           date.getFullYear() === year && 
                                           date.getMonth() === month;
                                } catch {
                                    return false;
                                }
                            })
                            .reduce((sum, t) => sum + t.amount, 0);
                    }),
                    backgroundColor: colorPalette[index % colorPalette.length],
                    borderColor: colorPalette[index % colorPalette.length],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                };
            });
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: data
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            color: '#ffffff' 
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        bodyFont: {
                            size: 13,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} RWF`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xAxisTitle,
                            font: {
                                size: 14,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            color: '#ffffff' 
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            color: '#ffffff' 
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Amount (RWF)',
                            font: {
                                size: 14,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            color: '#ffffff' 
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)' 
                        },
                        ticks: {
                            font: {
                                size: 11,
                                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                            },
                            color: '#ffffff' 
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
});