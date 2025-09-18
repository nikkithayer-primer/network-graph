/**
 * View Renderers Module
 * Handles rendering of different data views (summary, table, cards, aggregation)
 */

class ViewRenderers {
    /**
     * Render the summary statistics view
     * @param {Object} statistics - Statistics object from DataManager
     * @param {string} containerId - ID of the container element
     */
    static renderSummary(statistics, containerId = 'summaryStats') {
        const container = document.getElementById(containerId);
        const noData = document.querySelector('#summaryView .no-data');
        
        if (statistics.totalRecords === 0) {
            container.innerHTML = '';
            noData.style.display = 'block';
            return;
        }
        
        noData.style.display = 'none';

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
        const tableHeader = document.getElementById(headerContainerId);
        const tableBody = document.getElementById(bodyContainerId);

        if (data.length === 0) {
            tableHeader.innerHTML = '';
            tableBody.innerHTML = '<tr><td colspan="100%" class="no-data">No data to display</td></tr>';
            return;
        }

        const headers = Object.keys(data[0]);
        tableHeader.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

        tableBody.innerHTML = data.map(row => 
            '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'
        ).join('');
    }

    /**
     * Render the cards view
     * @param {Array<Object>} data - Array of data objects
     * @param {string} containerId - ID of the container element
     */
    static renderCards(data, containerId = 'cardContainer') {
        const container = document.getElementById(containerId);

        if (data.length === 0) {
            container.innerHTML = '<div class="no-data">No data to display</div>';
            return;
        }

        container.innerHTML = data.map(row => {
            const headers = Object.keys(row);
            return `
                <div class="data-card">
                    <div class="card-header">${row.Actor || 'Unknown Actor'} → ${row.Target || 'Unknown Target'}</div>
                    ${headers.map(header => `
                        <div class="card-field">
                            <span class="field-label">${header}:</span>
                            <span class="field-value">${row[header] || 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    }

    /**
     * Render the aggregation view
     * @param {Object} actorGroups - Groups organized by actor
     * @param {Object} targetGroups - Groups organized by target
     * @param {Object} locationGroups - Groups organized by location
     * @param {string} containerId - ID of the container element
     */
    static renderAggregation(actorGroups, targetGroups, locationGroups, containerId = 'aggregationContainer') {
        const container = document.getElementById(containerId);

        if (Object.keys(actorGroups).length === 0) {
            container.innerHTML = '<div class="no-data">No data to display</div>';
            return;
        }

        container.innerHTML = `
            <div class="aggregation-section">
                <div class="aggregation-title">📊 Group by Actor</div>
                ${ViewRenderers.renderGroups(actorGroups)}
            </div>
            <div class="aggregation-section">
                <div class="aggregation-title">🎯 Group by Target</div>
                ${ViewRenderers.renderGroups(targetGroups)}
            </div>
            <div class="aggregation-section">
                <div class="aggregation-title">📍 Group by Location</div>
                ${ViewRenderers.renderGroups(locationGroups)}
            </div>
        `;
    }

    /**
     * Render grouped data sections
     * @param {Object} groups - Grouped data object
     * @returns {string} HTML string for the groups
     */
    static renderGroups(groups) {
        return Object.entries(groups)
            .sort(([,a], [,b]) => b.length - a.length)
            .map(([key, items]) => `
                <div class="aggregation-group">
                    <div class="group-header">
                        ${key}
                        <span class="group-count">${items.length} items</span>
                    </div>
                    <div class="group-items">
                        ${items.slice(0, 6).map(item => `
                            <div class="group-item">
                                <strong>${item.Action || 'Unknown Action'}</strong><br>
                                <small>${item.Sentence ? item.Sentence.substring(0, 100) + '...' : 'No description'}</small>
                            </div>
                        `).join('')}
                        ${items.length > 6 ? `<div class="group-item group-item-more">...and ${items.length - 6} more</div>` : ''}
                    </div>
                </div>
            `).join('');
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
    }

    /**
     * Clear all view containers
     */
    static clearAllViews() {
        const containers = [
            'summaryStats',
            'tableHeader',
            'tableBody', 
            'cardContainer',
            'aggregationContainer'
        ];

        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
            }
        });

        // Show no-data messages
        const noDataElements = document.querySelectorAll('.no-data');
        noDataElements.forEach(element => {
            element.style.display = 'block';
        });
    }
}

// Export for use in other modules
window.ViewRenderers = ViewRenderers;
