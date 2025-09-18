/**
 * View Renderers Module
 * Handles rendering of different data views (summary, table, cards, aggregation)
 */

class ViewRenderers {
    static mapRenderer = null;
    static actorPillRenderer = null;
    static networkGraphRenderer = null;

    /**
     * Initialize the map renderer
     */
    static initializeMapRenderer() {
        if (!ViewRenderers.mapRenderer) {
            ViewRenderers.mapRenderer = new MapRenderer();
        }
    }

    /**
     * Initialize the actor pill renderer
     */
    static initializeActorPillRenderer() {
        if (!ViewRenderers.actorPillRenderer) {
            ViewRenderers.actorPillRenderer = new ActorPillRenderer();
        }
    }

    /**
     * Initialize the network graph renderer
     */
    static initializeNetworkGraphRenderer() {
        if (!ViewRenderers.networkGraphRenderer) {
            ViewRenderers.networkGraphRenderer = new NetworkGraphRenderer();
        }
    }

    /**
     * Render the summary statistics view
     * @param {Object} statistics - Statistics object from DataManager
     * @param {string} containerId - ID of the container element
     */
    static renderSummary(statistics, containerId = 'summaryStats') {
        const container = document.getElementById(containerId);
        const noData = document.querySelector('#tableView .no-data');
        
        if (statistics.totalRecords === 0) {
            container.innerHTML = '';
            if (noData) noData.style.display = 'block';
            return;
        }
        
        if (noData) noData.style.display = 'none';

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${statistics.totalRecords}</div>
                <div class="stat-label">Total Records</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${statistics.uniqueActors}</div>
                <div class="stat-label">Unique Actors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${statistics.uniqueTargets}</div>
                <div class="stat-label">Unique Targets</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${statistics.uniqueLocations}</div>
                <div class="stat-label">Unique Locations</div>
            </div>
        `;
    }

    /**
     * Render the table view
     * @param {Array<Object>} data - Array of data objects
     * @param {string} headerContainerId - ID of the table header container
     * @param {string} bodyContainerId - ID of the table body container
     */
    static renderTable(data, headerContainerId = 'tableHeader', bodyContainerId = 'tableBody') {
        ViewRenderers.initializeActorPillRenderer();
        
        const tableHeader = document.getElementById(headerContainerId);
        const tableBody = document.getElementById(bodyContainerId);
        const noData = document.querySelector('#tableView .no-data');

        if (data.length === 0) {
            tableHeader.innerHTML = '';
            tableBody.innerHTML = '';
            if (noData) noData.style.display = 'block';
            return;
        }

        // Hide no-data message
        if (noData) noData.style.display = 'none';

        const headers = Object.keys(data[0]);
        tableHeader.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

        tableBody.innerHTML = data.map(row => {
            return '<tr>' + headers.map(h => {
                const value = row[h] || '';
                // Render actor column with pills (handle comma-separated values)
                if (h === 'Actor' && value) {
                    return `<td>${ViewRenderers.actorPillRenderer.renderActorPillsFromString(value, 'table')}</td>`;
                }
                // Render target column with pills (handle comma-separated values)
                else if (h === 'Target' && value) {
                    return `<td>${ViewRenderers.actorPillRenderer.renderActorPillsFromString(value, 'table')}</td>`;
                }
                return `<td>${value}</td>`;
            }).join('') + '</tr>';
        }).join('');
    }

    /**
     * Render the map view
     * @param {Array<Object>} data - Array of data objects
     */
    static async renderMap(data) {
        ViewRenderers.initializeMapRenderer();
        
        // Initialize map if not already done
        if (!ViewRenderers.mapRenderer.map) {
            await ViewRenderers.mapRenderer.initializeMap('mapContainer');
        }
        
        // Render data on map
        await ViewRenderers.mapRenderer.renderData(data);
    }

    /**
     * Render the network graph view
     * @param {Array<Object>} data - Array of data objects
     */
    static async renderNetworkGraph(data) {
        ViewRenderers.initializeNetworkGraphRenderer();
        
        // Initialize network graph if not already done
        if (!ViewRenderers.networkGraphRenderer.svg) {
            ViewRenderers.networkGraphRenderer.initializeGraph('networkContainer');
        }
        
        // Render data on network graph
        await ViewRenderers.networkGraphRenderer.renderNetwork(data);
    }

    /**
     * Render the aggregation view
     * @param {Object} actorGroups - Groups organized by actor
     * @param {Object} targetGroups - Groups organized by target
     * @param {Object} locationGroups - Groups organized by location
     * @param {string} containerId - ID of the container element
     */
    static renderAggregation(actorGroups, targetGroups, locationGroups, containerId = 'aggregationContainer') {
        ViewRenderers.initializeActorPillRenderer();
        
        const container = document.getElementById(containerId);

        if (Object.keys(actorGroups).length === 0) {
            container.innerHTML = '<div class="no-data">No data to display</div>';
            return;
        }

        container.innerHTML = `
            <div class="aggregation-section">
                <div class="aggregation-title">📊 Group by Actor</div>
                ${ViewRenderers.renderGroups(actorGroups, 'actor')}
            </div>
            <div class="aggregation-section">
                <div class="aggregation-title">🎯 Group by Target</div>
                ${ViewRenderers.renderGroups(targetGroups, 'target')}
            </div>
            <div class="aggregation-section">
                <div class="aggregation-title">📍 Group by Location</div>
                ${ViewRenderers.renderGroups(locationGroups, 'location')}
            </div>
        `;
    }

    /**
     * Render grouped data sections
     * @param {Object} groups - Grouped data object
     * @param {string} groupType - Type of grouping: 'actor', 'target', or 'location'
     * @returns {string} HTML string for the groups
     */
    static renderGroups(groups, groupType = 'actor') {
        return Object.entries(groups)
            .sort(([,a], [,b]) => b.length - a.length)
            .map(([key, items]) => {
                const headerContent = (groupType === 'actor' || groupType === 'target') ? 
                    ViewRenderers.actorPillRenderer.renderActorPillsFromString(key) : 
                    key;
                
                return `
                    <div class="aggregation-group">
                        <div class="group-header">
                            ${headerContent}
                            <span class="group-count">${items.length} items</span>
                        </div>
                        <div class="group-items">
                            ${items.slice(0, 6).map(item => `
                                <div class="group-item">
                                    <div style="margin-bottom: 8px;">
                                        ${item.Actor ? ViewRenderers.actorPillRenderer.renderActorPillsFromString(item.Actor, 'table') : ''}
                                        ${item.Actor && item.Target ? ' → ' : ''}
                                        ${item.Target ? ViewRenderers.actorPillRenderer.renderActorPillsFromString(item.Target, 'table') : ''}
                                    </div>
                                    <div style="font-size: 14px; line-height: 1.4; margin-bottom: 4px;">
                                        ${item.Sentence || 'No description available'}
                                    </div>
                                    <small style="color: #6b7280; font-style: italic;">
                                        Action: ${item.Action || 'Unknown'}
                                        ${item['Date Received'] || item.Datetimes ? ` • ${item['Date Received'] || item.Datetimes}` : ''}
                                    </small>
                                </div>
                            `).join('')}
                            ${items.length > 6 ? `<div class="group-item group-item-more">...and ${items.length - 6} more</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
    }

    /**
     * Show or hide the controls section
     * @param {boolean} show - Whether to show the controls
     */
    static toggleControls(show) {
        const controls = document.getElementById('controls');
        const viewTabs = document.getElementById('viewTabs');
        
        controls.style.display = show ? 'flex' : 'none';
        viewTabs.style.display = show ? 'block' : 'none';
    }

    /**
     * Switch between different views
     * @param {string} viewName - Name of the view to switch to
     * @param {Event} event - Click event object
     */
    static switchView(viewName, event) {
        // Update tabs
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        if (event && event.target) {
            event.target.classList.add('active');
        }

        // Update views
        document.querySelectorAll('.data-view').forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.classList.add('active');
        }

        // Resize map when switching to map view
        if (viewName === 'map' && ViewRenderers.mapRenderer) {
            ViewRenderers.mapRenderer.resizeMap();
        }
        
        // Resize network graph when switching to network view
        if (viewName === 'network' && ViewRenderers.networkGraphRenderer) {
            ViewRenderers.networkGraphRenderer.resizeGraph();
        }
    }

    /**
     * Clear all view containers
     */
    static clearAllViews() {
        const containers = [
            'summaryStats',
            'tableHeader',
            'tableBody', 
            'aggregationContainer'
        ];

        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
            }
        });

        // Clear map
        if (ViewRenderers.mapRenderer) {
            ViewRenderers.mapRenderer.showNoData();
        }
        
        // Clear network graph
        if (ViewRenderers.networkGraphRenderer) {
            ViewRenderers.networkGraphRenderer.showNoData();
        }

        // Show no-data messages
        const noDataElements = document.querySelectorAll('.no-data');
        noDataElements.forEach(element => {
            element.style.display = 'block';
        });
    }
}

// Export for use in other modules
window.ViewRenderers = ViewRenderers;
