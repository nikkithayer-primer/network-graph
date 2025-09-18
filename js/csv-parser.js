/**
 * CSV Parser Module
 * Handles parsing of CSV files and converting them to JavaScript objects
 */

class CSVParser {
    /**
     * Parse CSV text into an array of objects
     * @param {string} csvText - Raw CSV text content
     * @returns {Array<Object>} Array of row objects
     */
    static parse(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = CSVParser.parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    data.push(row);
                }
            }
        }
        
        return data;
    }

    /**
     * Parse a single CSV line, handling quoted fields correctly
     * @param {string} line - Single CSV line
     * @returns {Array<string>} Array of field values
     */
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    /**
     * Validate if a file is a CSV file
     * @param {File} file - File object to validate
     * @returns {boolean} True if file is CSV
     */
    static isValidCSV(file) {
        return file.type === 'text/csv' || file.name.endsWith('.csv');
    }

    /**
     * Extract unique values from a specific field across all rows
     * @param {Array<Object>} data - Array of data objects
     * @param {string} field - Field name to extract values from
     * @returns {Array<string>} Sorted array of unique values
     */
    static getUniqueValues(data, field) {
        return [...new Set(data.map(row => row[field]).filter(value => value))].sort();
    }

    /**
     * Extract unique location values, handling comma-separated locations
     * @param {Array<Object>} data - Array of data objects
     * @returns {Array<string>} Sorted array of unique location values
     */
    static getUniqueLocations(data) {
        return [...new Set(data.flatMap(row => 
            row.Locations ? row.Locations.split(',').map(l => l.trim()) : []
        ))].sort();
    }
}

// Export for use in other modules
window.CSVParser = CSVParser;
