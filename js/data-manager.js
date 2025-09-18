/**
 * Data Manager Module
 * Handles data storage, filtering, and sorting operations
 */

class DataManager {
    constructor() {
        this.originalData = [];
        this.currentData = [];
        this.filteredData = [];
        this.filters = {
            actor: '',
            target: '',
            location: ''
        };
        this.sorting = {
            field: 'datetime',
            order: 'asc'
        };
    }

    /**
     * Set the original data and reset filters
     * @param {Array<Object>} data - Array of data objects
     */
    setData(data) {
        this.originalData = [...data];
        this.currentData = [...data];
        this.resetFilters();
        this.applyFilters();
    }

    /**
     * Get the current filtered and sorted data
     * @returns {Array<Object>} Filtered data array
     */
    getFilteredData() {
        return this.filteredData;
    }

    /**
     * Get the original unfiltered data
     * @returns {Array<Object>} Original data array
     */
    getOriginalData() {
        return this.originalData;
    }

    /**
     * Reset all filters to default values
     */
    resetFilters() {
        this.filters = {
            actor: '',
            target: '',
            location: ''
        };
        this.sorting = {
            field: 'datetime',
            order: 'asc'
        };
    }

    /**
     * Set filter values
     * @param {Object} filters - Filter object with actor, target, location properties
     */
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.applyFilters();
    }

    /**
     * Set sorting parameters
     * @param {string} field - Field to sort by
     * @param {string} order - Sort order ('asc' or 'desc')
     */
    setSorting(field, order) {
        this.sorting = { field, order };
        this.applyFilters();
    }

    /**
     * Apply current filters and sorting to the data
     */
    applyFilters() {
        // Apply filters
        this.filteredData = this.currentData.filter(row => {
            // Check actor filter (handle comma-separated values)
            if (this.filters.actor) {
                const actors = row.Actor ? row.Actor.split(',').map(a => a.trim()) : [];
                if (!actors.includes(this.filters.actor)) return false;
            }
            
            // Check target filter (handle comma-separated values)
            if (this.filters.target) {
                const targets = row.Target ? row.Target.split(',').map(t => t.trim()) : [];
                if (!targets.includes(this.filters.target)) return false;
            }
            
            // Check location filter (already handles comma-separated values)
            if (this.filters.location && (!row.Locations || !row.Locations.includes(this.filters.location))) return false;
            
            return true;
        });

        // Apply sorting
        this.filteredData.sort((a, b) => {
            let aValue, bValue;
            
            switch(this.sorting.field) {
                case 'datetime':
                    aValue = new Date(a.Datetimes || a['Date Received'] || 0);
                    bValue = new Date(b.Datetimes || b['Date Received'] || 0);
                    break;
                case 'actor':
                    aValue = (a.Actor || '').toLowerCase();
                    bValue = (b.Actor || '').toLowerCase();
                    break;
                case 'target':
                    aValue = (a.Target || '').toLowerCase();
                    bValue = (b.Target || '').toLowerCase();
                    break;
                case 'action':
                    aValue = (a.Action || '').toLowerCase();
                    bValue = (b.Action || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return this.sorting.order === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sorting.order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Get unique values for filter dropdowns
     * @returns {Object} Object with actors, targets, and locations arrays
     */
    getFilterOptions() {
        // Get unique actors (handle comma-separated values)
        const actorSet = new Set();
        this.currentData.forEach(row => {
            if (row.Actor && row.Actor.trim()) {
                const actors = row.Actor.split(',').map(a => a.trim()).filter(a => a.length > 0);
                actors.forEach(actor => actorSet.add(actor));
            }
        });

        // Get unique targets (handle comma-separated values)
        const targetSet = new Set();
        this.currentData.forEach(row => {
            if (row.Target && row.Target.trim()) {
                const targets = row.Target.split(',').map(t => t.trim()).filter(t => t.length > 0);
                targets.forEach(target => targetSet.add(target));
            }
        });

        return {
            actors: [...actorSet].sort(),
            targets: [...targetSet].sort(),
            locations: CSVParser.getUniqueLocations(this.currentData)
        };
    }

    /**
     * Group data by a specific field
     * @param {string} field - Field to group by
     * @returns {Object} Grouped data object
     */
    groupBy(field) {
        const groups = {};
        this.filteredData.forEach(row => {
            const value = row[field];
            if (!value || !value.trim()) {
                // Handle empty/null values
                if (!groups['Unknown']) groups['Unknown'] = [];
                groups['Unknown'].push(row);
            } else if (field === 'Actor' || field === 'Target') {
                // Handle comma-separated values for Actor and Target fields
                const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
                items.forEach(item => {
                    if (!groups[item]) groups[item] = [];
                    groups[item].push(row);
                });
            } else {
                // Handle single values for other fields
                if (!groups[value]) groups[value] = [];
                groups[value].push(row);
            }
        });
        return groups;
    }

    /**
     * Group data by location, handling comma-separated locations
     * @returns {Object} Grouped data object by location
     */
    groupByLocation() {
        const groups = {};
        this.filteredData.forEach(row => {
            const locations = row.Locations ? row.Locations.split(',').map(l => l.trim()) : ['Unknown'];
            locations.forEach(location => {
                if (!groups[location]) groups[location] = [];
                groups[location].push(row);
            });
        });
        return groups;
    }

    /**
     * Get summary statistics for the current filtered data
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const data = this.filteredData;
        
        // Calculate unique actors (handle comma-separated values)
        const actorSet = new Set();
        data.forEach(row => {
            if (row.Actor && row.Actor.trim()) {
                const actors = row.Actor.split(',').map(a => a.trim()).filter(a => a.length > 0);
                actors.forEach(actor => actorSet.add(actor));
            }
        });

        // Calculate unique targets (handle comma-separated values)
        const targetSet = new Set();
        data.forEach(row => {
            if (row.Target && row.Target.trim()) {
                const targets = row.Target.split(',').map(t => t.trim()).filter(t => t.length > 0);
                targets.forEach(target => targetSet.add(target));
            }
        });
        
        return {
            totalRecords: data.length,
            uniqueActors: actorSet.size,
            uniqueTargets: targetSet.size,
            uniqueLocations: new Set(data.flatMap(row => 
                row.Locations ? row.Locations.split(',').map(l => l.trim()) : []
            )).size
        };
    }

    /**
     * Check if there is any data loaded
     * @returns {boolean} True if data is available
     */
    hasData() {
        return this.originalData.length > 0;
    }

    /**
     * Check if there is any filtered data
     * @returns {boolean} True if filtered data is available
     */
    hasFilteredData() {
        return this.filteredData.length > 0;
    }
}

// Export for use in other modules
window.DataManager = DataManager;
