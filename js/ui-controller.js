/**
 * UI Controller Module
 * Manages UI interactions, form controls, and event handling
 */

class UIController {
    constructor(dataManager, onDataChanged) {
        this.dataManager = dataManager;
        this.onDataChanged = onDataChanged;
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for UI controls
     */
    setupEventListeners() {
        // Filter controls
        const filterElements = [
            'actorFilter',
            'targetFilter', 
            'locationFilter',
            'sortBy',
            'sortOrder'
        ];

        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.handleFilterChange());
            }
        });

        // View switching - handled globally through window functions
        window.switchView = (viewName) => {
            ViewRenderers.switchView(viewName, event);
        };
        
        // Upload view switching - handled globally
        window.showUploadView = () => {
            if (window.app) {
                window.app.showUploadView();
                window.app.reset();
            }
        };
    }

    /**
     * Handle filter and sort changes
     */
    handleFilterChange() {
        const filters = {
            actor: document.getElementById('actorFilter').value,
            target: document.getElementById('targetFilter').value,
            location: document.getElementById('locationFilter').value
        };

        const sortField = document.getElementById('sortBy').value;
        const sortOrder = document.getElementById('sortOrder').value;

        // Update data manager
        this.dataManager.setFilters(filters);
        this.dataManager.setSorting(sortField, sortOrder);

        // Notify that data has changed
        if (this.onDataChanged) {
            this.onDataChanged();
        }
    }

    /**
     * Populate filter dropdowns with unique values
     * @param {Object} options - Object with actors, targets, and locations arrays
     */
    populateFilters(options) {
        this.populateSelect('actorFilter', options.actors, 'Actors');
        this.populateSelect('targetFilter', options.targets, 'Targets');
        this.populateSelect('locationFilter', options.locations, 'Locations');
    }

    /**
     * Populate a select element with options
     * @param {string} selectId - ID of the select element
     * @param {Array<string>} options - Array of option values
     * @param {string} label - Label for the "All" option
     */
    populateSelect(selectId, options, label) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="">All ${label}</option>`;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // Restore previous selection if it still exists
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Reset all filters to default values
     */
    resetFilters() {
        const filterIds = ['actorFilter', 'targetFilter', 'locationFilter'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Reset sort controls
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');
        
        if (sortBy) sortBy.value = 'datetime';
        if (sortOrder) sortOrder.value = 'asc';
    }

    /**
     * Show or hide the controls section
     * @param {boolean} show - Whether to show controls
     */
    showControls(show = true) {
        ViewRenderers.toggleControls(show);
    }

    /**
     * Get current filter values
     * @returns {Object} Current filter values
     */
    getCurrentFilters() {
        return {
            actor: document.getElementById('actorFilter')?.value || '',
            target: document.getElementById('targetFilter')?.value || '',
            location: document.getElementById('locationFilter')?.value || ''
        };
    }

    /**
     * Get current sort settings
     * @returns {Object} Current sort settings
     */
    getCurrentSort() {
        return {
            field: document.getElementById('sortBy')?.value || 'datetime',
            order: document.getElementById('sortOrder')?.value || 'asc'
        };
    }

    /**
     * Set filter values programmatically
     * @param {Object} filters - Filter values to set
     */
    setFilters(filters) {
        if (filters.actor !== undefined) {
            const actorFilter = document.getElementById('actorFilter');
            if (actorFilter) actorFilter.value = filters.actor;
        }
        
        if (filters.target !== undefined) {
            const targetFilter = document.getElementById('targetFilter');
            if (targetFilter) targetFilter.value = filters.target;
        }
        
        if (filters.location !== undefined) {
            const locationFilter = document.getElementById('locationFilter');
            if (locationFilter) locationFilter.value = filters.location;
        }
    }

    /**
     * Set sort values programmatically
     * @param {string} field - Sort field
     * @param {string} order - Sort order
     */
    setSort(field, order) {
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');
        
        if (sortBy && field) sortBy.value = field;
        if (sortOrder && order) sortOrder.value = order;
    }

    /**
     * Enable or disable all controls
     * @param {boolean} enabled - Whether controls should be enabled
     */
    setControlsEnabled(enabled) {
        const controlIds = [
            'actorFilter',
            'targetFilter',
            'locationFilter', 
            'sortBy',
            'sortOrder'
        ];

        controlIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !enabled;
            }
        });
    }

    /**
     * Show loading state for controls
     */
    showLoadingState() {
        this.setControlsEnabled(false);
        // Could add loading spinners here if needed
    }

    /**
     * Hide loading state for controls
     */
    hideLoadingState() {
        this.setControlsEnabled(true);
    }
}

// Export for use in other modules
window.UIController = UIController;
