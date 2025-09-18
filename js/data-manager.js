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
            if (this.filters.actor && row.Actor !== this.filters.actor) return false;
            if (this.filters.target && row.Target !== this.filters.target) return false;
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
        return {
            actors: CSVParser.getUniqueValues(this.currentData, 'Actor'),
            targets: CSVParser.getUniqueValues(this.currentData, 'Target'),
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
            const key = row[field] || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
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
        
        return {
            totalRecords: data.length,
            uniqueActors: new Set(data.map(row => row.Actor).filter(a => a)).size,
            uniqueTargets: new Set(data.map(row => row.Target).filter(t => t)).size,
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
