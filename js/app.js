/**
 * Main Application Controller
 * Coordinates all modules and manages the overall application state
 */

class NetworkGraphApp {
    constructor() {
        this.dataManager = new DataManager();
        this.politicalDataManager = new PoliticalDataManager();
        this.profilePage = new ProfilePage();
        this.fileHandler = null;
        this.uiController = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
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

        // Load political data first
        await this.loadInitialPoliticalData();

        // Set initial view to network graph to show political data
        ViewRenderers.switchView('network');
        
        console.log('Network Graph CSV Analyzer initialized');
    }

    /**
     * Load initial political data and display network graph
     */
    async loadInitialPoliticalData() {
        try {
            const loaded = await this.politicalDataManager.loadPoliticalData();
            if (loaded) {
                // Update datetime formats and add locations to events
                this.politicalDataManager.updateDateTimeFormats();
                
                // Create initial network data from political figures
                const networkData = this.politicalDataManager.createInitialNetworkData();
                
                // Show the network graph with political data
                if (networkData.nodes.length > 0) {
                    await ViewRenderers.renderInitialPoliticalNetwork(networkData);
                    console.log(`Loaded initial network with ${networkData.nodes.length} political figures`);
                }
            }
        } catch (error) {
            console.error('Error loading initial political data:', error);
            // Don't show alert as this is not critical for basic functionality
        }
    }

    /**
     * Handle when new data is loaded from a CSV file
     * @param {Array<Object>} data - Parsed CSV data
     */
    async handleDataLoaded(data) {
        try {
            console.log(`Loaded ${data.length} records from CSV`);
            
            // Enhance CSV data with political figure matches
            const enhancedData = this.politicalDataManager.isDataLoaded() 
                ? this.politicalDataManager.enhanceCSVData(data)
                : data;
            
            // Check if we have existing political data to preserve
            if (this.politicalDataManager.isDataLoaded() && !this.dataManager.hasData()) {
                // First time loading CSV with political data - merge both
                const politicalRecords = this.politicalDataManager.createPoliticalDataRecords();
                const allData = [...politicalRecords, ...enhancedData];
                this.dataManager.setData(allData);
                console.log(`Initialized with ${politicalRecords.length} political connections and ${enhancedData.length} CSV records`);
            } else if (this.dataManager.hasData()) {
                // We already have data - merge the new CSV data with existing
                this.dataManager.mergeData(enhancedData);
                console.log(`Merged ${enhancedData.length} new CSV records with existing data`);
            } else {
                // No existing data - just set the CSV data
                this.dataManager.setData(enhancedData);
                console.log(`Set ${enhancedData.length} CSV records as initial data`);
            }
            
            // Update filter options
            const filterOptions = this.dataManager.getFilterOptions();
            this.uiController.populateFilters(filterOptions);
            
            // Hide upload section and show content area
            this.showDataView();
            
            // Show controls
            this.uiController.showControls(true);
            
            // Update all views (initial render) - this will include both political and CSV data
            this.updateAllViews();
            
            // Initialize actor classifications (async)
            this.initializeActorClassifications(enhancedData);
            
        } catch (error) {
            console.error('Error handling loaded data:', error);
            alert('Error processing the CSV data. Please check the file format.');
        }
    }

    /**
     * Initialize actor classifications using Wikidata
     * @param {Array<Object>} data - Data array
     */
    async initializeActorClassifications(data) {
        try {
            // Initialize actor pill renderer if not already done
            ViewRenderers.initializeActorPillRenderer();
            
            // Start classification process
            await ViewRenderers.actorPillRenderer.initializeClassifications(data);
            
            console.log('Actor classifications initialized');
            
        } catch (error) {
            console.error('Error initializing actor classifications:', error);
            // Don't show alert for classification errors as it's not critical
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

            // Update table view (includes summary stats at the top)
            ViewRenderers.renderSummary(statistics);
            ViewRenderers.renderTable(filteredData);

            // Update map view
            ViewRenderers.renderMap(filteredData);

            // Update network graph view
            ViewRenderers.renderNetworkGraph(filteredData);

            // Update timeline view
            ViewRenderers.renderTimeline(filteredData);

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
     * Show the data view and hide the upload section
     */
    showDataView() {
        // Hide upload section
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
        
        // Show content area (it should already be visible, but ensure it is)
        const content = document.querySelector('.content');
        if (content) {
            content.style.display = 'block';
        }
    }

    /**
     * Show the upload view and hide the data content
     */
    showUploadView() {
        // Show upload section
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
        
        // Content area can remain visible as it will show "no data" messages
    }

    /**
     * Reset the entire application to initial state
     */
    reset() {
        // Reset data manager
        this.dataManager = new DataManager();
        
        // Show upload view again
        this.showUploadView();
        
        // Reset UI
        this.uiController.resetFilters();
        this.uiController.showControls(false);
        
        // Reset file handler
        this.fileHandler.reset();
        
        // Clear all views
        ViewRenderers.clearAllViews();
        
        // Set initial view to table (since we removed summary)
        ViewRenderers.switchView('table');
        
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
