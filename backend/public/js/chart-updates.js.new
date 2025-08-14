// Global chart references
let cpuChart = null;
let memoryChart = null;
let networkChart = null;
let processesChart = null;

// Chart data structure with initial data
const chartData = {
    timestamps: Array(10).fill(''),
    cpuUsage: Array(10).fill(0),
    load1m: Array(10).fill(0),
    memoryUsed: Array(10).fill(0),
    heapUsed: Array(10).fill(0),
    external: Array(10).fill(0),
    networkIn: Array(10).fill(0),
    networkOut: Array(10).fill(0)
};

// Maximum number of data points to keep
const MAX_DATA_POINTS = 30;

// Simple logger
function log(message) {
    console.log(`[Chart] ${message}`);
}

// Show error message in UI
function showError(message) {
    console.error(`[Chart Error] ${message}`);
    try {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.backgroundColor = '#ff4444';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.fontFamily = 'Roboto Mono, monospace';
        errorDiv.textContent = `Chart Error: ${message}`;
        document.body.appendChild(errorDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 10000);
    } catch (e) {
        console.error('Failed to show error message:', e);
    }
}

// Initialize charts
function initCharts() {
    log('Initializing charts...');
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        showError('Chart.js is not loaded. Please check your internet connection.');
        return false;
    }
    
    // Check for required canvas elements
    const requiredCharts = ['cpuUsageChart', 'memoryUsageChart'];
    const missingCharts = requiredCharts.filter(id => !document.getElementById(id));
    
    if (missingCharts.length > 0) {
        showError(`Missing chart containers: ${missingCharts.join(', ')}`);
        return false;
    }
    
    try {
        // Initialize CPU Chart
        const cpuCtx = document.getElementById('cpuUsageChart').getContext('2d');
        log('Initializing CPU chart...');
        
        cpuChart = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: [...chartData.timestamps],
                datasets: [
                    {
                        label: 'CPU Usage %',
                        data: [...chartData.cpuUsage],
                        borderColor: '#4dabf7',
                        backgroundColor: 'rgba(77, 171, 247, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Load (1m)',
                        data: [...chartData.load1m],
                        borderColor: '#ff8787',
                        backgroundColor: 'rgba(255, 135, 135, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#fff',
                            font: { family: 'Roboto Mono, monospace' }
                        }
                    },
                    title: {
                        display: true,
                        text: 'CPU Usage',
                        color: '#fff',
                        font: {
                            size: 14,
                            family: 'Roboto Mono, monospace',
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#fff',
                            font: { family: 'Roboto Mono, monospace' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { family: 'Roboto Mono, monospace', size: 10 },
                            maxTicksLimit: 6
                        }
                    }
                }
            }
        });
        
        log('CPU chart initialized');
        return true;
        
    } catch (error) {
        console.error('Error initializing charts:', error);
        showError('Failed to initialize charts: ' + error.message);
        return false;
    }
}

// Update chart data
function updateCharts(data) {
    if (!data) return;
    
    // Add new data point
    const now = new Date();
    chartData.timestamps.push(now.toLocaleTimeString());
    
    // Update data arrays with new values or keep previous value if not provided
    if (typeof data.cpu === 'number') chartData.cpuUsage.push(data.cpu);
    if (typeof data.load1m === 'number') chartData.load1m.push(data.load1m);
    
    // Trim old data points
    if (chartData.timestamps.length > MAX_DATA_POINTS) {
        chartData.timestamps.shift();
        chartData.cpuUsage.shift();
        chartData.load1m.shift();
    }
    
    // Update charts if they exist
    if (cpuChart) {
        cpuChart.data.labels = [...chartData.timestamps];
        cpuChart.data.datasets[0].data = [...chartData.cpuUsage];
        if (cpuChart.data.datasets[1]) {
            cpuChart.data.datasets[1].data = [...chartData.load1m];
        }
        cpuChart.update();
    }
}

// Initialize everything when the page loads
function initializeDashboard() {
    log('Initializing dashboard...');
    
    // Initialize charts
    if (initCharts()) {
        log('All charts initialized successfully');
        
        // Add sample data to make charts visible
        setTimeout(() => {
            const sampleData = {
                timestamp: new Date().toLocaleTimeString(),
                cpu: Math.floor(Math.random() * 100),
                load1m: Math.random() * 10
            };
            
            updateCharts(sampleData);
            log('Added sample data to charts');
            
            // Update charts every 2 seconds with new data
            setInterval(() => {
                const updateData = {
                    cpu: Math.max(0, Math.min(100, chartData.cpuUsage[chartData.cpuUsage.length - 1] + (Math.random() * 20 - 10))),
                    load1m: Math.max(0, Math.min(10, chartData.load1m[chartData.load1m.length - 1] + (Math.random() * 2 - 1)))
                };
                updateCharts(updateData);
            }, 2000);
            
        }, 500);
    }
}

// Start initialization when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        log('DOM fully loaded, initializing dashboard...');
        setTimeout(initializeDashboard, 100);
    });
} else {
    // DOM already loaded
    log('DOM already loaded, initializing dashboard...');
    setTimeout(initializeDashboard, 100);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCharts,
        updateCharts,
        initializeDashboard
    };
}
