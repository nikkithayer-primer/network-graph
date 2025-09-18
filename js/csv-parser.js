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
                    
                    // Process the row to split actors and targets with "&" or "and"
                    const processedRows = CSVParser.splitActorsAndTargets(row);
                    
                    // Normalize datetime fields in each processed row
                    const normalizedRows = processedRows.map(processedRow => 
                        CSVParser.normalizeDateTimeFields(processedRow)
                    );
                    
                    data.push(...normalizedRows);
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

    /**
     * Split actors and targets that contain "&" or "and" into separate rows
     * @param {Object} row - Original row object
     * @returns {Array<Object>} Array of row objects with split actors/targets
     */
    static splitActorsAndTargets(row) {
        const actors = CSVParser.splitEntityNames(row.Actor || '');
        const targets = CSVParser.splitEntityNames(row.Target || '');
        
        // If no splitting occurred, return original row
        if (actors.length <= 1 && targets.length <= 1) {
            return [row];
        }
        
        // Create combinations of all actors with all targets
        const resultRows = [];
        const actorList = actors.length > 0 ? actors : [''];
        const targetList = targets.length > 0 ? targets : [''];
        
        for (const actor of actorList) {
            for (const target of targetList) {
                const newRow = { ...row };
                if (actor) newRow.Actor = actor;
                if (target) newRow.Target = target;
                resultRows.push(newRow);
            }
        }
        
        return resultRows;
    }

    /**
     * Split entity names that contain "&" or "and"
     * @param {string} entityString - String containing entity names
     * @returns {Array<string>} Array of individual entity names
     */
    static splitEntityNames(entityString) {
        if (!entityString || typeof entityString !== 'string') {
            return [];
        }
        
        // First split by commas (existing behavior)
        const commaSplit = entityString.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        // Then split each part by "&" or "and"
        const finalSplit = [];
        
        for (const part of commaSplit) {
            // Split by "&" or " and " (with spaces to avoid splitting words like "Anderson")
            const andSplit = part.split(/\s+(?:&|and)\s+/i)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            if (andSplit.length > 1) {
                // Multiple entities found
                finalSplit.push(...andSplit);
            } else {
                // Check for "&" without spaces
                const ampersandSplit = part.split('&')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                
                if (ampersandSplit.length > 1) {
                    finalSplit.push(...ampersandSplit);
                } else {
                    // No splitting needed
                    finalSplit.push(part);
                }
            }
        }
        
        return finalSplit;
    }

    /**
     * Normalize datetime fields in a row using natural language parsing
     * @param {Object} row - Row object to normalize
     * @returns {Object} Row with normalized datetime fields
     */
    static normalizeDateTimeFields(row) {
        const normalizedRow = { ...row };
        const dateTimeParser = new DateTimeParser();
        
        // List of fields that might contain datetime information
        const dateTimeFields = ['Datetimes', 'Date Received', 'Date', 'Time', 'DateTime'];
        
        dateTimeFields.forEach(field => {
            if (normalizedRow[field] && typeof normalizedRow[field] === 'string') {
                const originalValue = normalizedRow[field].trim();
                
                // Only process if it looks like natural language
                if (dateTimeParser.containsNaturalLanguage(originalValue)) {
                    const normalizedDate = dateTimeParser.parseAndNormalize(originalValue);
                    
                    // Log the transformation for debugging
                    if (normalizedDate !== originalValue) {
                        console.log(`DateTime normalized: "${originalValue}" → "${normalizedDate}"`);
                    }
                    
                    normalizedRow[field] = normalizedDate;
                }
            }
        });
        
        return normalizedRow;
    }
}

// Export for use in other modules
window.CSVParser = CSVParser;
