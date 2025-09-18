/**
 * Knowledge Base Manager Module
 * Manages pre-curated entity data that serves as the primary lookup source
 * before falling back to Wikidata API calls for entity classification
 */

class PoliticalDataManager {
    constructor() {
        this.politicalFigures = [];
        this.figureMap = new Map(); // For quick lookup by name/alternate names
        this.isLoaded = false;
    }

    /**
     * Load knowledge base data from JSON file
     * This serves as the primary entity lookup source before Wikidata API calls
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadPoliticalData() {
        try {
            const response = await fetch('/json/politics_plus_us_nonpolitical_100_plus_orgs.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.politicalFigures = data.nodes || [];
            
            // Debug: Check if raw data has edges that might cause issues
            if (data.edges) {
                console.log(`Raw JSON has ${data.edges.length} edges - these will be ignored`);
                // Make sure we don't accidentally use raw edges anywhere
                delete data.edges;
            }
            
            // Build lookup map for quick matching
            this.buildFigureMap();
            
            this.isLoaded = true;
            console.log(`Loaded ${this.politicalFigures.length} entities into knowledge base`);
            return true;
            
        } catch (error) {
            console.error('Error loading political data:', error);
            this.isLoaded = false;
            return false;
        }
    }

    /**
     * Build a map for quick figure lookup by name and alternate names
     */
    buildFigureMap() {
        this.figureMap.clear();
        
        this.politicalFigures.forEach(figure => {
            const primaryName = figure.id.toLowerCase();
            
            // Add primary name
            this.figureMap.set(primaryName, figure);
            
            // Add primary name without titles
            const primaryWithoutTitles = this.removeCommonTitles(primaryName);
            if (primaryWithoutTitles !== primaryName) {
                this.figureMap.set(primaryWithoutTitles, figure);
            }
            
            // Add alternate names
            if (figure.alternate_names && Array.isArray(figure.alternate_names)) {
                figure.alternate_names.forEach(altName => {
                    const altNameLower = altName.toLowerCase();
                    this.figureMap.set(altNameLower, figure);
                    
                    // Add alternate name without titles
                    const altWithoutTitles = this.removeCommonTitles(altNameLower);
                    if (altWithoutTitles !== altNameLower) {
                        this.figureMap.set(altWithoutTitles, figure);
                    }
                });
            }
            
            // Add common title variations for this figure
            this.addCommonTitleVariations(figure);
        });
    }

    /**
     * Add common title variations for a political figure
     * @param {Object} figure - Political figure object
     */
    addCommonTitleVariations(figure) {
        const baseName = figure.id.toLowerCase();
        const role = figure.role ? figure.role.toLowerCase() : '';
        
        // Generate title variations based on role
        const titleVariations = [];
        
        if (role.includes('senator')) {
            titleVariations.push(`sen. ${baseName}`, `senator ${baseName}`);
        }
        
        if (role.includes('representative')) {
            titleVariations.push(`rep. ${baseName}`, `representative ${baseName}`);
        }
        
        if (role.includes('governor')) {
            titleVariations.push(`gov. ${baseName}`, `governor ${baseName}`);
        }
        
        if (role.includes('president') && !role.includes('vice')) {
            titleVariations.push(`pres. ${baseName}`, `president ${baseName}`);
        }
        
        if (role.includes('vice president')) {
            titleVariations.push(`vice president ${baseName}`, `vp ${baseName}`);
        }
        
        if (role.includes('secretary')) {
            titleVariations.push(`sec. ${baseName}`, `secretary ${baseName}`);
        }
        
        if (role.includes('speaker')) {
            titleVariations.push(`speaker ${baseName}`);
        }
        
        if (role.includes('attorney general')) {
            titleVariations.push(`attorney general ${baseName}`);
        }
        
        // Add all variations to the map
        titleVariations.forEach(variation => {
            this.figureMap.set(variation, figure);
        });
        
        // Add last name only for prominent figures (if unique enough)
        this.addLastNameVariations(figure);
    }

    /**
     * Add last name variations for prominent political figures
     * @param {Object} figure - Political figure object
     */
    addLastNameVariations(figure) {
        const fullName = figure.id.toLowerCase();
        const nameParts = fullName.split(' ');
        
        // Only add last name mapping for figures with clear last names
        if (nameParts.length >= 2) {
            const lastName = nameParts[nameParts.length - 1];
            
            // Only add last name for very prominent figures to avoid conflicts
            const prominentLastNames = [
                'trump', 'biden', 'harris', 'obama', 'clinton', 'sanders', 'warren',
                'desantis', 'newsom', 'abbott', 'whitmer', 'pence'
            ];
            
            if (prominentLastNames.includes(lastName)) {
                // Check if this last name would be unique
                let isUnique = true;
                for (const otherFigure of this.politicalFigures) {
                    if (otherFigure.id !== figure.id) {
                        const otherLastName = otherFigure.id.toLowerCase().split(' ').pop();
                        if (otherLastName === lastName) {
                            isUnique = false;
                            break;
                        }
                    }
                }
                
                if (isUnique) {
                    this.figureMap.set(lastName, figure);
                }
            }
        }
    }

    /**
     * Find a political figure by name (case insensitive)
     * @param {string} name - Name to search for
     * @returns {Object|null} Political figure object or null if not found
     */
    findFigure(name) {
        if (!name || typeof name !== 'string') return null;
        
        // Clean and normalize the name
        const cleanName = this.cleanNameForMatching(name);
        
        // Try matching without titles first (most common case for political figures)
        const nameWithoutTitles = this.cleanNameForMatching(this.removeCommonTitles(name));
        
        // Try exact match without titles first
        const titleMatch = this.figureMap.get(nameWithoutTitles);
        if (titleMatch) return titleMatch;
        
        // Try exact match with original clean name
        const exactMatch = this.figureMap.get(cleanName);
        if (exactMatch) return exactMatch;
        
        // Try partial matching without titles
        for (const [key, figure] of this.figureMap.entries()) {
            const keyWithoutTitles = this.removeCommonTitles(key);
            const cleanKeyWithoutTitles = this.cleanNameForMatching(keyWithoutTitles);
            
            // Check if names match when both have titles removed
            if (cleanKeyWithoutTitles === nameWithoutTitles) {
                return figure;
            }
            
            // Check partial matches
            if (cleanKeyWithoutTitles.includes(nameWithoutTitles) || nameWithoutTitles.includes(cleanKeyWithoutTitles)) {
                // Only match if the shorter name is at least 3 characters to avoid false positives
                if (Math.min(cleanKeyWithoutTitles.length, nameWithoutTitles.length) >= 3) {
                    return figure;
                }
            }
        }
        
        // Try partial matching with original names (fallback)
        for (const [key, figure] of this.figureMap.entries()) {
            if (key.includes(cleanName) || cleanName.includes(key)) {
                // Only match if the shorter name is at least 3 characters to avoid false positives
                if (Math.min(key.length, cleanName.length) >= 3) {
                    return figure;
                }
            }
        }
        
        return null;
    }

    /**
     * Clean name for matching (normalize case, trim whitespace)
     * @param {string} name - Name to clean
     * @returns {string} Cleaned name
     */
    cleanNameForMatching(name) {
        return name.toLowerCase().trim();
    }

    /**
     * Remove common political titles from names for better matching
     * @param {string} name - Name with potential titles
     * @returns {string} Name without common titles
     */
    removeCommonTitles(name) {
        // List of common political titles and their variations
        const titles = [
            'sen\\.?\\s+', 'senator\\s+',
            'rep\\.?\\s+', 'representative\\s+',
            'gov\\.?\\s+', 'governor\\s+',
            'pres\\.?\\s+', 'president\\s+',
            'vice\\s+president\\s+', 'vp\\s+',
            'sec\\.?\\s+', 'secretary\\s+',
            'attorney\\s+general\\s+',
            'speaker\\s+',
            'leader\\s+',
            'chair\\s+', 'chairman\\s+', 'chairwoman\\s+',
            'amb\\.?\\s+', 'ambassador\\s+',
            'judge\\s+', 'justice\\s+',
            'mayor\\s+',
            'dr\\.?\\s+', 'doctor\\s+',
            'mr\\.?\\s+', 'mrs\\.?\\s+', 'ms\\.?\\s+', 'miss\\s+',
            'the\\s+honorable\\s+', 'hon\\.?\\s+'
        ];
        
        let cleanName = name;
        
        // Remove titles from the beginning of the name
        for (const title of titles) {
            const regex = new RegExp('^' + title, 'gi');
            cleanName = cleanName.replace(regex, '');
        }
        
        return cleanName.trim();
    }

    /**
     * Get all political figures
     * @returns {Array<Object>} Array of political figure objects
     */
    getAllFigures() {
        return this.politicalFigures;
    }

    /**
     * Check if political data is loaded
     * @returns {boolean} True if data is loaded
     */
    isDataLoaded() {
        return this.isLoaded;
    }

    /**
     * Create network graph data from political figures
     * @returns {Object} Object with nodes and links arrays
     */
    createInitialNetworkData() {
        if (!this.isLoaded || this.politicalFigures.length === 0) {
            return { nodes: [], links: [] };
        }

        // Convert political figures to network nodes
        const nodes = this.politicalFigures.map(figure => ({
            id: figure.id,
            name: figure.id,
            type: 'political_figure',
            role: figure.role,
            state: figure.state_or_country,
            party: this.extractParty(figure),
            radius: 15, // Standard size for political figures
            count: figure.connections ? figure.connections.length : 0,
            actions: new Set(['political_connection']),
            records: [],
            politicalData: figure // Store full political data
        }));

        // Create links from connections in the JSON data
        const links = [];
        this.politicalFigures.forEach(figure => {
            if (figure.connections && Array.isArray(figure.connections)) {
                figure.connections.forEach(connection => {
                    // Find the target figure
                    const targetFigure = this.findFigure(connection.target);
                    if (targetFigure) {
                        links.push({
                            source: figure.id,
                            target: connection.target,
                            relationship: connection.relationship,
                            action: 'political_connection',
                            count: 1,
                            actions: new Set(['political_connection']),
                            records: [],
                            isPoliticalConnection: true
                        });
                    } else {
                        console.warn(`Skipping connection to non-existent figure: ${connection.target} from ${figure.id}`);
                    }
                });
            }
        });

        // Return only the processed nodes and links, ignoring any raw edges from JSON
        console.log(`Created network data: ${nodes.length} nodes, ${links.length} links`);
        return { 
            nodes, 
            links,
            // Explicitly exclude any raw edges/links from the JSON to prevent D3 errors
            edges: undefined 
        };
    }

    /**
     * Create data records from political connections that can be merged with CSV data
     * @returns {Array<Object>} Array of data records representing political connections
     */
    createPoliticalDataRecords() {
        if (!this.isLoaded || this.politicalFigures.length === 0) {
            return [];
        }

        const records = [];
        
        this.politicalFigures.forEach(figure => {
            if (figure.connections && Array.isArray(figure.connections)) {
                figure.connections.forEach(connection => {
                    // Find the target figure to get more details
                    const targetFigure = this.findFigure(connection.target);
                    if (targetFigure) {
                        // Create a data record that matches CSV format
                        const record = {
                            Actor: figure.id,
                            Target: connection.target,
                            Action: 'political_connection',
                            Sentence: `${figure.id} has ${connection.relationship} relationship with ${connection.target}`,
                            Locations: this.getCombinedLocations(figure, targetFigure),
                            Datetimes: new Date().toISOString().split('T')[0], // Use current date as placeholder
                            'Date Received': new Date().toISOString().split('T')[0],
                            // Add metadata to identify as political data
                            _isPoliticalConnection: true,
                            _sourceRole: figure.role,
                            _targetRole: targetFigure.role,
                            _relationship: connection.relationship
                        };
                        records.push(record);
                    }
                });
            }
        });

        console.log(`Created ${records.length} political data records for merging`);
        return records;
    }

    /**
     * Get combined locations for two political figures
     * @param {Object} figure1 - First political figure
     * @param {Object} figure2 - Second political figure
     * @returns {string} Combined location string
     */
    getCombinedLocations(figure1, figure2) {
        const locations = [];
        
        // Add location for figure1
        if (figure1.state_or_country) {
            const loc1 = figure1.non_us ? figure1.state_or_country : `${figure1.state_or_country}, United States`;
            locations.push(loc1);
        }
        
        // Add location for figure2 if different
        if (figure2.state_or_country && figure2.state_or_country !== figure1.state_or_country) {
            const loc2 = figure2.non_us ? figure2.state_or_country : `${figure2.state_or_country}, United States`;
            locations.push(loc2);
        }
        
        if (locations.length === 0) locations.push('United States');
        return locations.join(', ');
    }

    /**
     * Extract party affiliation from figure data
     * @param {Object} figure - Political figure object
     * @returns {string} Party name or 'Independent'
     */
    extractParty(figure) {
        if (!figure.organizations) return 'Independent';
        
        for (const org of figure.organizations) {
            if (org.name.includes('Democratic Party')) return 'Democratic';
            if (org.name.includes('Republican Party')) return 'Republican';
        }
        
        return 'Independent';
    }

    /**
     * Enhance CSV data with political figure information
     * @param {Array<Object>} csvData - CSV data records
     * @returns {Array<Object>} Enhanced CSV data with political figure matches
     */
    enhanceCSVData(csvData) {
        if (!this.isLoaded) return csvData;

        return csvData.map(record => {
            const enhancedRecord = { ...record };
            
            // Check if actor matches a political figure
            if (record.Actor) {
                const actors = record.Actor.split(',').map(a => a.trim());
                const matchedActors = actors.map(actor => {
                    const figure = this.findFigure(actor);
                    return figure ? { name: actor, figure } : { name: actor, figure: null };
                });
                enhancedRecord.actorMatches = matchedActors;
            }

            // Check if target matches a political figure
            if (record.Target) {
                const targets = record.Target.split(',').map(t => t.trim());
                const matchedTargets = targets.map(target => {
                    const figure = this.findFigure(target);
                    return figure ? { name: target, figure } : { name: target, figure: null };
                });
                enhancedRecord.targetMatches = matchedTargets;
            }

            return enhancedRecord;
        });
    }

    /**
     * Get profile data for a specific figure name
     * @param {string} name - Name of the figure
     * @param {Array<Object>} csvData - CSV data to find related sentences
     * @returns {Object|null} Profile data object
     */
    getProfileData(name, csvData = []) {
        const figure = this.findFigure(name);
        if (!figure) return null;

        // Find related CSV sentences
        const relatedSentences = [];
        csvData.forEach(record => {
            const actors = record.Actor ? record.Actor.split(',').map(a => a.trim()) : [];
            const targets = record.Target ? record.Target.split(',').map(t => t.trim()) : [];
            
            if (actors.includes(name) || targets.includes(name) || 
                actors.some(actor => this.findFigure(actor)?.id === figure.id) ||
                targets.some(target => this.findFigure(target)?.id === figure.id)) {
                relatedSentences.push(record);
            }
        });

        return {
            ...figure,
            relatedSentences,
            profileType: 'political_figure'
        };
    }

    /**
     * Update datetime formats in political data
     */
    updateDateTimeFormats() {
        this.politicalFigures.forEach(figure => {
            // Update events dates
            if (figure.events && Array.isArray(figure.events)) {
                figure.events.forEach(event => {
                    if (event.date) {
                        event.datetime = this.convertToISO(event.date);
                        // Add location if not present
                        if (!event.location) {
                            event.location = this.inferEventLocation(figure, event);
                        }
                    }
                });
            }

            // Update quotes dates
            if (figure.quotes && Array.isArray(figure.quotes)) {
                figure.quotes.forEach(quote => {
                    if (quote.date) {
                        quote.datetime = this.convertToISO(quote.date);
                    }
                });
            }
        });
    }

    /**
     * Convert date string to ISO datetime format
     * @param {string} dateStr - Date string to convert
     * @returns {string} ISO datetime string
     */
    convertToISO(dateStr) {
        if (!dateStr) return '';
        
        try {
            // Handle various date formats
            if (dateStr.includes('T')) {
                // Already in ISO format
                return dateStr;
            }
            
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // YYYY-MM-DD format
                return `${dateStr}T12:00:00+00:00`;
            }
            
            if (dateStr.match(/^\d{4}-\d{2}$/)) {
                // YYYY-MM format
                return `${dateStr}-15T12:00:00+00:00`;
            }
            
            if (dateStr.match(/^\d{4}$/)) {
                // YYYY format
                return `${dateStr}-06-15T12:00:00+00:00`;
            }
            
            // Try to parse as date and convert
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
            
            return dateStr; // Return original if can't parse
            
        } catch (error) {
            console.warn('Error converting date:', dateStr, error);
            return dateStr;
        }
    }

    /**
     * Infer event location based on figure data
     * @param {Object} figure - Political figure
     * @param {Object} event - Event object
     * @returns {string} Inferred location
     */
    inferEventLocation(figure, event) {
        // Try to infer location from event name or figure's state/role
        const eventName = event.name ? event.name.toLowerCase() : '';
        
        if (eventName.includes('uk') || eventName.includes('london')) {
            return 'London, United Kingdom';
        }
        
        if (eventName.includes('jerusalem')) {
            return 'Jerusalem, Israel';
        }
        
        if (eventName.includes('capitol') || eventName.includes('washington')) {
            return 'Washington, DC';
        }
        
        if (eventName.includes('state of the state') && figure.state_or_country) {
            return `${figure.state_or_country}, United States`;
        }
        
        // Default to figure's state or DC for federal officials
        if (figure.role && (figure.role.includes('President') || figure.role.includes('Secretary') || 
                           figure.role.includes('Attorney General') || figure.role.includes('House') || 
                           figure.role.includes('Senate'))) {
            return 'Washington, DC';
        }
        
        // Handle both US states and non-US countries
        if (figure.state_or_country) {
            // If it's a non-US figure, don't append "United States"
            if (figure.non_us) {
                return figure.state_or_country;
            } else {
                return `${figure.state_or_country}, United States`;
            }
        }
        return 'United States';
    }

    /**
     * Get entity information from knowledge base for classification
     * This should be called BEFORE making Wikidata API calls
     * @param {string} entityName - Name of entity to look up
     * @returns {Object|null} Entity data with classification info, or null if not found
     */
    getEntityFromKnowledgeBase(entityName) {
        if (!this.isLoaded || !entityName) {
            return null;
        }

        // Try direct lookup first
        const figure = this.findFigure(entityName);
        if (figure) {
            return {
                name: figure.id,
                classification: this.inferClassificationFromFigure(figure),
                role: figure.role,
                party: figure.party,
                state: figure.state_or_country,
                organizations: figure.organizations || [],
                connections: figure.connections || [],
                events: figure.events || [],
                quotes: figure.quotes || [],
                alternate_names: figure.alternate_names || [],
                source: 'knowledge_base',
                confidence: 'high'
            };
        }

        return null;
    }

    /**
     * Infer classification from knowledge base figure data
     * @param {Object} figure - Figure object from knowledge base
     * @returns {string} Classification type
     */
    inferClassificationFromFigure(figure) {
        if (!figure.role) return 'person';

        const role = figure.role.toLowerCase();
        
        // Political office holders
        if (role.includes('senator') || role.includes('representative') || 
            role.includes('governor') || role.includes('president') ||
            role.includes('mayor') || role.includes('judge')) {
            return 'public_office';
        }
        
        // Organizations
        if (role.includes('organization') || role.includes('company') || 
            role.includes('corporation') || role.includes('foundation')) {
            return 'organization';
        }
        
        // Political organizations
        if (role.includes('party') || role.includes('committee') || 
            role.includes('pac') || role.includes('campaign')) {
            return 'political_organization';
        }
        
        // Default to person for political figures
        return 'person';
    }

    /**
     * Get all entity names from knowledge base for pre-caching
     * @returns {Array<string>} Array of all entity names in knowledge base
     */
    getAllKnowledgeBaseEntities() {
        if (!this.isLoaded) {
            return [];
        }

        const entities = new Set();
        
        // Add primary names
        this.politicalFigures.forEach(figure => {
            if (figure.id) {
                entities.add(figure.id);
            }
        });
        
        // Add alternate names from the figure map
        for (const [name, figure] of this.figureMap) {
            entities.add(name);
        }
        
        return Array.from(entities);
    }
}

// Export for use in other modules
window.PoliticalDataManager = PoliticalDataManager;
