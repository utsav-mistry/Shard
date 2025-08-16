// Get the current host and protocol
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const socketUrl = `${protocol}//${host}/socket.io`;

// Track connection state
let socket = null;
let isConnected = false;

// Connection status element
const connectionStatus = document.getElementById('connectionStatus');

// Show initial connection status
if (connectionStatus) {
    connectionStatus.textContent = 'Connecting to server...';
    connectionStatus.className = 'connecting';
}

// Function to initialize socket connection
function initSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    // Initialize socket with explicit URL and options
    socket = io({
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        forceNew: true,
        autoConnect: true,
        withCredentials: true,
        extraHeaders: {
            'X-Health-Dashboard': 'true'
        },
        rememberUpgrade: true,
        rejectUnauthorized: false,
        secure: window.location.protocol === 'https:',
        protocol: window.location.protocol === 'https:' ? 'wss' : 'ws'
    });

    setupSocketHandlers();
    return socket;
}

// Setup socket event handlers
function setupSocketHandlers() {
    if (!socket) return;

    // Connection event handlers
    socket.on('connect', () => {
        const connectTime = new Date().toISOString();
        console.log(`[${connectTime}] Connected to WebSocket server with ID:`, socket.id);

        if (connectionStatus) {
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'connected';
        }

        isConnected = true;
        updateConnectionUI(true);

        // Request initial data on connect
        console.log('Requesting initial health data...');
        socket.emit('request-health', { timestamp: Date.now() }, (response) => {
            console.log('Initial health data response:', response);
        });
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        if (connectionStatus) {
            connectionStatus.textContent = `Connection Error: ${error.message || 'Unknown error'}`;
            connectionStatus.className = 'error';
        }
        isConnected = false;
        updateConnectionUI(false);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        if (connectionStatus) {
            connectionStatus.textContent = `Disconnected: ${reason}`;
            connectionStatus.className = 'disconnected';
        }
        isConnected = false;
        updateConnectionUI(false);
    });

    socket.on('reconnecting', (attempt) => {
        console.log(`Reconnecting attempt ${attempt}`);
        const status = `Reconnecting (${attempt})...`;
        if (connectionStatus) {
            connectionStatus.textContent = status;
            connectionStatus.className = 'reconnecting';
        }
    });

    socket.on('reconnect_failed', () => {
        const errorMsg = 'Failed to reconnect to server';
        console.error(errorMsg);
        if (connectionStatus) {
            connectionStatus.textContent = errorMsg;
            connectionStatus.className = 'error';
        }
        isConnected = false;
        updateConnectionUI(false);
    });

    // Handle incoming health data
    socket.on('health-data', (data) => {
        console.log('Received health data:', data);

        // Debug: Log the data structure for charts
        console.log('Chart data structure:', {
            cpu: data.cpu,
            memory: data.memory,
            network: data.network
        });

        // Update last updated timestamp
        const now = new Date();
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl) {
            lastUpdatedEl.innerHTML = `Last updated: <span>${now.toLocaleTimeString()}</span>`;
        }

        // Update charts if the function is available
        if (typeof window.updateCharts === 'function') {
            console.log('Calling updateCharts with data:', {
                cpuUsage: data.cpu?.usage,
                load1m: data.cpu?.load1m,
                memoryUsed: data.memory?.used,
                heapUsed: data.memory?.heapUsed,
                external: data.memory?.external,
                networkIn: data.network?.rx,
                networkOut: data.network?.tx
            });
            window.updateCharts(data);
        }

        // Update overall status
        updateStatusIndicator('serverStatus', data.status === 'ok' ? 'ok' : 'error');

        // Update backend service information
        if (data.status) {
            const backendStatusEl = document.getElementById('backendStatus');
            const backendStatusTextEl = document.getElementById('backendStatusText');
            const backendUptimeEl = document.getElementById('backendUptime');
            const backendEnvEl = document.getElementById('backendEnv');
            const nodeVersionEl = document.getElementById('nodeVersion');
            const platformEl = document.getElementById('platform');
            const processIdEl = document.getElementById('processId');

            if (data.status === 'ok') {
                updateStatusIndicator('backendStatus', 'ok');
                if (backendStatusTextEl) backendStatusTextEl.textContent = 'Running';

                // Update environment info
                if (data.environment && backendEnvEl) {
                    backendEnvEl.textContent = data.environment;
                }

                // Update uptime
                if (data.uptime && backendUptimeEl) {
                    backendUptimeEl.textContent = formatUptime(data.uptime);
                }

                // Update server info
                if (data.server) {
                    if (nodeVersionEl) nodeVersionEl.textContent = data.server.nodeVersion || 'N/A';
                    if (platformEl) platformEl.textContent = data.server.platform || 'N/A';
                    if (processIdEl) processIdEl.textContent = data.server.pid || 'N/A';
                }
            } else {
                updateStatusIndicator('backendStatus', 'error');
                if (backendStatusTextEl) backendStatusTextEl.textContent = 'Error';
            }
        }

        // Update memory information
        if (data.memory) {
            updateStatusIndicator('memoryStatus', 'ok');

            const rssEl = document.getElementById('memoryRSS');
            const heapTotalEl = document.getElementById('memoryHeapTotal');
            const heapUsedEl = document.getElementById('memoryHeapUsed');
            const externalEl = document.getElementById('memoryExternal');

            if (rssEl) rssEl.textContent = data.memory.rss || 'N/A';
            if (heapTotalEl) heapTotalEl.textContent = data.memory.heapTotal || 'N/A';
            if (heapUsedEl) heapUsedEl.textContent = data.memory.heapUsed || 'N/A';
            if (externalEl) externalEl.textContent = data.memory.external || 'N/A';
        }

        // Update CPU information
        if (data.cpu) {
            updateStatusIndicator('cpuStatus', 'ok');

            const cpuCoresEl = document.getElementById('cpuCores');
            const load1mEl = document.getElementById('load1m');
            const load5mEl = document.getElementById('load5m');
            const load15mEl = document.getElementById('load15m');

            if (cpuCoresEl) cpuCoresEl.textContent = data.cpu.cpuCount || 'N/A';

            if (data.cpu.loadAverage && Array.isArray(data.cpu.loadAverage)) {
                if (load1mEl) load1mEl.textContent = data.cpu.loadAverage[0]?.toFixed(2) || 'N/A';
                if (load5mEl) load5mEl.textContent = data.cpu.loadAverage[1]?.toFixed(2) || 'N/A';
                if (load15mEl) load15mEl.textContent = data.cpu.loadAverage[2]?.toFixed(2) || 'N/A';
            }
        }

        // Update database information
        if (data.database) {
            const dbStatusEl = document.getElementById('dbStatus');
            const dbStatusTextEl = document.getElementById('dbStatusText');
            const dbHostEl = document.getElementById('dbHost');
            const dbNameEl = document.getElementById('dbName');
            const dbDriverEl = document.getElementById('dbDriver');
            const dbCollectionsEl = document.getElementById('dbCollections');

            // Update database status
            if (data.database.status === 'connected') {
                updateStatusIndicator('dbStatus', 'ok');
                if (dbStatusTextEl) dbStatusTextEl.textContent = 'Connected';

                // Update database details
                if (dbHostEl) dbHostEl.textContent = data.database.host || 'N/A';
                if (dbNameEl) dbNameEl.textContent = data.database.name || 'N/A';
                if (dbDriverEl) dbDriverEl.textContent = data.database.driver ?
                    `${data.database.driver.name} v${data.database.driver.version}` : 'N/A';

                // Update collections list
                if (dbCollectionsEl) {
                    if (data.database.collections && data.database.collections.length > 0) {
                        dbCollectionsEl.innerHTML = ''; // Clear loading message
                        const collectionsList = document.createElement('div');
                        collectionsList.className = 'collections-list';

                        data.database.collections.forEach(collection => {
                            const collectionItem = document.createElement('div');
                            collectionItem.className = 'collection-item';
                            collectionItem.textContent = collection;
                            collectionsList.appendChild(collectionItem);
                        });

                        dbCollectionsEl.appendChild(collectionsList);
                    } else if (data.database.collectionsError) {
                        dbCollectionsEl.innerHTML = `<span class="error-text">${data.database.collectionsError}</span>`;
                    } else {
                        dbCollectionsEl.innerHTML = '<span class="no-collections">No collections found</span>';
                    }
                }
            } else {
                updateStatusIndicator('dbStatus', 'error');
                if (dbStatusTextEl) dbStatusTextEl.textContent = 'Disconnected';
                if (dbHostEl) dbHostEl.textContent = 'N/A';
                if (dbNameEl) dbNameEl.textContent = 'N/A';
                if (dbDriverEl) dbDriverEl.textContent = 'N/A';
                if (dbCollectionsEl) {
                    dbCollectionsEl.innerHTML = '<span class="no-collections">Not connected to database</span>';
                }
            }
        }

        // Update service statuses
        if (data.services) {
            // Update deployment worker
            if (data.services['deployment-worker']) {
                const worker = data.services['deployment-worker'];
                const statusEl = document.getElementById('workerStatus');
                const statusTextEl = document.getElementById('workerStatusText');
                const responseTimeEl = document.getElementById('workerResponseTime');
                const uptimeEl = document.getElementById('workerUptime');
                const versionEl = document.getElementById('workerVersion');
                const queueEl = document.getElementById('workerQueue');
                const memoryEl = document.getElementById('workerMemory');

                if (worker.status === 'ok' && worker.details) {
                    const details = worker.details;
                    updateStatusIndicator('workerStatus', 'ok');
                    if (statusTextEl) statusTextEl.textContent = 'Running';
                    if (responseTimeEl) responseTimeEl.textContent = worker.responseTime ? `${worker.responseTime}ms` : 'N/A';
                    
                    // Use pre-formatted display strings if available
                    if (details.display) {
                        if (uptimeEl) uptimeEl.textContent = details.display.uptime || 'N/A';
                        if (versionEl) versionEl.textContent = details.version || 'N/A';
                        if (queueEl) queueEl.textContent = details.display.queue || 'N/A';
                        if (memoryEl) memoryEl.textContent = details.display.memory || 'N/A';
                    } else {
                        // Fallback to manual formatting
                        if (uptimeEl) uptimeEl.textContent = formatUptime(details.uptime);
                        if (versionEl) versionEl.textContent = details.version || 'N/A';
                        if (queueEl) {
                            const active = details.queue?.active || 0;
                            const queued = details.queue?.queued || 0;
                            const concurrency = details.queue?.concurrency?.concurrency || details.queue?.concurrency || 0;
                            queueEl.textContent = `${active} active, ${queued} queued (${concurrency} max)`;
                        }
                        if (memoryEl && details.memory) {
                            memoryEl.textContent = `${formatBytes(details.memory.heapUsed)} / ${formatBytes(details.memory.heapTotal)}`;
                        }
                    }
                } else {
                    updateStatusIndicator('workerStatus', 'error');
                    if (statusTextEl) statusTextEl.textContent = worker.error || 'Service Unavailable';
                    if (responseTimeEl) responseTimeEl.textContent = 'N/A';
                    if (uptimeEl) uptimeEl.textContent = 'N/A';
                    if (versionEl) versionEl.textContent = 'N/A';
                    if (queueEl) queueEl.textContent = 'N/A';
                    if (memoryEl) memoryEl.textContent = 'N/A';
                }
            }

            // Update AI review service
            if (data.services['ai-review']) {
                updateAIServiceStatus(data.services['ai-review']);
            }
        }

        // Update database status
        if (data.database) {
            const statusEl = document.getElementById('dbStatus');
            const statusTextEl = document.getElementById('dbStatusText');
            const hostEl = document.getElementById('dbHost');

            if (data.database.status === 'connected') {
                updateStatusIndicator('dbStatus', 'ok');
                if (statusTextEl) statusTextEl.textContent = 'Connected';
                if (hostEl) hostEl.textContent = data.database.host || 'N/A';
            } else {
                updateStatusIndicator('dbStatus', 'error');
                if (statusTextEl) statusTextEl.textContent = data.database.error || 'Disconnected';
                if (hostEl) hostEl.textContent = 'N/A';
            }
        }
    });
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to update status indicators
function updateStatusIndicator(elementId, status) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Remove all status classes
    element.className = 'status-indicator';

    // Add the appropriate status class
    if (status === 'ok') {
        element.classList.add('status-ok');
    } else if (status === 'error') {
        element.classList.add('status-error');
    } else if (status === 'warning') {
        element.classList.add('status-warning');
    } else {
        element.classList.add('status-unknown');
    }
}

// Update UI based on connection state
function updateConnectionUI(connected) {
    const toggleBtn = document.getElementById('toggleConnectionBtn');
    if (!toggleBtn) return;

    if (connected) {
        toggleBtn.textContent = 'Disconnect';
        toggleBtn.className = 'btn btn-sm btn-outline-danger';
        toggleBtn.onclick = disconnectSocket;
    } else {
        toggleBtn.textContent = 'Connect';
        toggleBtn.className = 'btn btn-sm btn-outline-success';
        toggleBtn.onclick = connectSocket;
    }
}

// Function to connect socket
function connectSocket() {
    if (!isConnected) {
        initSocket();
    }
}

// Function to disconnect socket
function disconnectSocket() {
    if (socket && isConnected) {
        socket.disconnect();
        isConnected = false;
        updateConnectionUI(false);
    }
}

// Format uptime to human-readable format
function formatUptime(seconds) {
    if (seconds === undefined || seconds === null) return 'N/A';

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}

// Update AI Review Service status with detailed information
function updateAIServiceStatus(aiData) {
    if (!aiData) return;

    const statusElement = document.getElementById('aiStatus');
    const statusText = document.getElementById('aiStatusText');
    const responseTimeElement = document.getElementById('aiResponseTime');

    if (aiData.status === 'ok') {
        updateStatusIndicator('aiStatus', 'ok');
        if (statusText) statusText.textContent = 'Operational';

        // Update detailed information if available
        if (aiData.details) {
            // System Info
            if (aiData.details.system) {
                const system = aiData.details.system;
                const pythonVersionEl = document.getElementById('aiPythonVersion');
                const platformEl = document.getElementById('aiPlatform');

                if (pythonVersionEl) pythonVersionEl.textContent = system.python_version || '-';
                if (platformEl) platformEl.textContent = system.platform || '-';
            }

            // Process Info
            if (aiData.details.process) {
                const process = aiData.details.process;
                const pidEl = document.getElementById('aiPid');
                const cpuEl = document.getElementById('aiCpuPercent');
                const memoryRssEl = document.getElementById('aiMemoryRss');
                const memoryVmsEl = document.getElementById('aiMemoryVms');

                if (pidEl) pidEl.textContent = process.pid || '-';
                // Check for cpu_percent at the root level of the process object
                const cpuPercent = process.cpu_percent !== undefined ? process.cpu_percent :
                    (process.cpu_percent === 0 ? 0 : null);
                if (cpuEl) {
                    cpuEl.textContent = cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : 'N/A';
                }

                if (process.memory_info) {
                    if (memoryRssEl) memoryRssEl.textContent = formatBytes(process.memory_info.rss || 0);
                    if (memoryVmsEl) memoryVmsEl.textContent = formatBytes(process.memory_info.vms || 0);
                }
            }

            // Dependencies
            if (aiData.details.dependencies) {
                const deps = aiData.details.dependencies;
                const djangoEl = document.getElementById('aiDjangoVersion');
                const drfEl = document.getElementById('aiDrfVersion');

                if (djangoEl) djangoEl.textContent = deps.django || '-';
                if (drfEl) drfEl.textContent = deps.djangorestframework || '-';
            }
        }
    } else {
        updateStatusIndicator('aiStatus', 'error');
        if (statusText) statusText.textContent = aiData.error || 'Service Unavailable';
    }

    if (aiData.responseTime) {
        if (responseTimeElement) responseTimeElement.textContent = `${aiData.responseTime}ms`;
    }
}

// Initialize connection toggle button
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggleConnectionBtn';
    toggleBtn.className = 'btn btn-sm';

    const headerActions = document.getElementById('headerActions');
    if (headerActions) {
        headerActions.appendChild(toggleBtn);
        updateConnectionUI(false);
    } else {
        // Fallback to old position if header-actions is not found
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.insertAdjacentElement('afterend', toggleBtn);
            updateConnectionUI(false);
        }
    }

    // Initialize socket connection
    initSocket();
});
