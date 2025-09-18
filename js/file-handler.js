/**
 * File Handler Module
 * Manages file upload, drag and drop functionality
 */

class FileHandler {
    constructor(fileInputId, uploadAreaId, onFileProcessed) {
        this.fileInput = document.getElementById(fileInputId);
        this.uploadArea = document.getElementById(uploadAreaId);
        this.onFileProcessed = onFileProcessed;
        
        this.setupEventListeners();
    }

    /**
     * Set up all event listeners for file handling
     */
    setupEventListeners() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    }

    /**
     * Handle drag over event
     * @param {DragEvent} e - Drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    /**
     * Handle drag leave event
     * @param {DragEvent} e - Drag event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    /**
     * Handle file drop event
     * @param {DragEvent} e - Drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Handle file selection from input
     * @param {Event} e - Change event
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Process the selected file
     * @param {File} file - File to process
     */
    processFile(file) {
        if (!CSVParser.isValidCSV(file)) {
            alert('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvData = CSVParser.parse(e.target.result);
                this.onFileProcessed(csvData);
            } catch (error) {
                console.error('Error parsing CSV:', error);
                alert('Error parsing CSV file. Please check the file format.');
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsText(file);
    }

    /**
     * Reset the file input
     */
    reset() {
        this.fileInput.value = '';
        this.uploadArea.classList.remove('dragover');
    }
}

// Export for use in other modules
window.FileHandler = FileHandler;
