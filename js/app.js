/**
 * Main Application Controller
 * Coordinates all modules and manages the overall application state
 */

class NetworkGraphApp {
    constructor() {
        this.dataManager = new DataManager();
        this.fileHandler = null;
        this.uiController = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize UI Controller
        this.uiController = new UIController(
            this.dataManager, 
            () => this.updateAllViews()
        );

        // Initialize File Handler
        this.fileHandler = new FileHandler(
            'fileInput',
            'uploadArea', 
            (data) => this.handleDataLoaded(data)
        );

        // Set initial view
        ViewRenderers.switchView('summary');
        
        console.log('Network Graph CSV Analyzer initialized');
    }

    /**
     * Handle when new data is loaded from a CSV file
     * @param {Array<Object>} data - Parsed CSV data
     */
    handleDataLoaded(data) {
        try {
            console.log(`Loaded ${data.length} records from CSV`);
            
            // Set data in the data manager
            this.dataManager.setData(data);
            
            // Update filter options
            const filterOptions = this.dataManager.getFilterOptions();
            this.uiController.populateFilters(filterOptions);
            
            // Show controls
            this.uiController.showControls(true);
            
            // Update all views
            this.updateAllViews();
            
        } catch (error) {
            console.error('Error handling loaded data:', error);
            alert('Error processing the CSV data. Please check the file format.');
        }
    }

    /**
     * Update all data views
     */
    updateAllViews() {
        try {
            if (!this.dataManager.hasData()) {
                ViewRenderers.clearAllViews();
                return;
            }

            const filteredData = this.dataManager.getFilteredData();
            const statistics = this.dataManager.getStatistics();

            // Update summary view
            ViewRenderers.renderSummary(statistics);

            // Update table view
            ViewRenderers.renderTable(filteredData);

            // Update cards view
            ViewRenderers.renderCards(filteredData);

            // Update aggregation view
            const actorGroups = this.dataManager.groupBy('Actor');
            const targetGroups = this.dataManager.groupBy('Target');
            const locationGroups = this.dataManager.groupByLocation();
            
            ViewRenderers.renderAggregation(actorGroups, targetGroups, locationGroups);

        } catch (error) {
            console.error('Error updating views:', error);
            alert('Error updating the display. Please try refreshing the page.');
        }
    }

    /**
     * Reset the entire application to initial state
     */
    reset() {
        // Reset data manager
        this.dataManager = new DataManager();
        
        // Reset UI
        this.uiController.resetFilters();
        this.uiController.showControls(false);
        
        // Reset file handler
        this.fileHandler.reset();
        
        // Clear all views
        ViewRenderers.clearAllViews();
        
        // Set initial view
        ViewRenderers.switchView('summary');
        
        console.log('Application reset');
    }

    /**
     * Export current filtered data as CSV
     * @returns {string} CSV string of current data
     */
    exportFilteredData() {
        const data = this.dataManager.getFilteredData();
        if (data.length === 0) {
            alert('No data to export');
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Escape quotes and wrap in quotes if contains comma
                    return value.includes(',') || value.includes('"') 
                        ? `"${value.replace(/"/g, '""')}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    /**
     * Download the current filtered data as a CSV file
     */
    downloadFilteredData() {
        const csvContent = this.exportFilteredData();
        if (!csvContent) return;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'filtered_data.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Get application statistics
     * @returns {Object} Application statistics
     */
    getAppStatistics() {
        return {
            hasData: this.dataManager.hasData(),
            totalRecords: this.dataManager.getOriginalData().length,
            filteredRecords: this.dataManager.getFilteredData().length,
            currentFilters: this.uiController.getCurrentFilters(),
            currentSort: this.uiController.getCurrentSort()
        };
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NetworkGraphApp();
});

// Export for potential external use
window.NetworkGraphApp = NetworkGraphApp;
