/**
 * Wikidata Classifier Module
 * Queries Wikidata to classify actors by their "instance of" property
 */

class WikidataClassifier {
    constructor() {
        this.cache = new Map();
        this.pendingQueries = new Map();
        this.rateLimitDelay = 100; // ms between requests
        this.lastRequestTime = 0;
        
        // Wikidata entity IDs for classification
        this.classifications = {
            // Countries and regions
            'Q6256': 'country', // country
            'Q3024240': 'country', // historical country
            'Q7275': 'region', // state
            'Q1048835': 'region', // political territorial entity
            'Q82794': 'region', // geographic region
            'Q56061': 'region', // administrative territorial entity
            'Q15284': 'region', // municipality
            'Q515': 'region', // city
            'Q1549591': 'region', // big city
            'Q5119': 'region', // capital
            'Q1637706': 'region', // city with millions of inhabitants
            
            // People
            'Q5': 'person', // human
            'Q215627': 'person', // person
            
            // Organizations
            'Q43229': 'organization', // organization
            'Q4830453': 'organization', // business
            'Q783794': 'organization', // company
            'Q891723': 'organization', // public company
            'Q1616075': 'organization', // private company
            'Q4830453': 'organization', // enterprise
            'Q2659904': 'organization', // government organization
            'Q327333': 'organization', // government agency
            'Q1391145': 'organization', // international organization
            'Q163740': 'organization', // non-profit organization
            'Q7278': 'organization', // political party
            'Q31855': 'organization', // research institute
            'Q2467461': 'organization', // university
            'Q3918': 'organization', // university
            'Q875538': 'organization', // university
            'Q1371037': 'organization', // military organization
            'Q61951': 'organization', // armed forces
        };
    }

    /**
     * Classify a list of actors using Wikidata
     * @param {Array<string>} actors - Array of actor names
     * @returns {Promise<Map>} Map of actor name to classification
     */
    async classifyActors(actors) {
        const results = new Map();
        const uniqueActors = [...new Set(actors.filter(actor => actor && actor.trim()))];
        
        console.log(`Classifying ${uniqueActors.length} unique actors using Wikidata`);

        for (const actor of uniqueActors) {
            const classification = await this.classifyActor(actor);
            results.set(actor, classification);
        }

        return results;
    }

    /**
     * Classify a single actor
     * @param {string} actor - Actor name
     * @returns {Promise<string>} Classification: 'country', 'region', 'person', 'organization', or 'unknown'
     */
    async classifyActor(actor) {
        if (!actor || !actor.trim()) return 'unknown';

        const normalizedActor = actor.trim();
        
        // Check cache first
        if (this.cache.has(normalizedActor)) {
            return this.cache.get(normalizedActor);
        }

        // Check if query is already pending
        if (this.pendingQueries.has(normalizedActor)) {
            return await this.pendingQueries.get(normalizedActor);
        }

        // Create pending query promise
        const queryPromise = this.performWikidataQuery(normalizedActor);
        this.pendingQueries.set(normalizedActor, queryPromise);

        try {
            const result = await queryPromise;
            this.cache.set(normalizedActor, result);
            this.pendingQueries.delete(normalizedActor);
            return result;
        } catch (error) {
            console.warn(`Failed to classify actor: ${normalizedActor}`, error);
            this.pendingQueries.delete(normalizedActor);
            this.cache.set(normalizedActor, 'unknown');
            return 'unknown';
        }
    }

    /**
     * Perform the actual Wikidata SPARQL query
     * @param {string} actor - Actor name to query
     * @returns {Promise<string>} Classification result
     */
    async performWikidataQuery(actor) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();

        // SPARQL query to find entities and their "instance of" properties
        const sparqlQuery = `
            SELECT DISTINCT ?item ?instanceOf WHERE {
              ?item rdfs:label "${actor}"@en .
              ?item wdt:P31 ?instanceOf .
            }
            LIMIT 10
        `;

        const encodedQuery = encodeURIComponent(sparqlQuery);
        const url = `https://query.wikidata.org/sparql?query=${encodedQuery}&format=json`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'NetworkGraphAnalyzer/1.0 (https://github.com/user/network-graph)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this.analyzeWikidataResults(data);
            
        } catch (error) {
            console.warn(`Wikidata query failed for "${actor}":`, error);
            return 'unknown';
        }
    }

    /**
     * Analyze Wikidata query results to determine classification
     * @param {Object} data - Wikidata SPARQL results
     * @returns {string} Classification result
     */
    analyzeWikidataResults(data) {
        if (!data.results || !data.results.bindings || data.results.bindings.length === 0) {
            return 'unknown';
        }

        // Count classifications from all results
        const classificationCounts = {
            country: 0,
            region: 0,
            person: 0,
            organization: 0
        };

        for (const binding of data.results.bindings) {
            if (binding.instanceOf && binding.instanceOf.value) {
                const entityId = binding.instanceOf.value.split('/').pop();
                const classification = this.classifications[entityId];
                
                if (classification) {
                    classificationCounts[classification]++;
                }
            }
        }

        // Return the most common classification, or 'unknown' if none found
        const maxCount = Math.max(...Object.values(classificationCounts));
        if (maxCount === 0) {
            return 'unknown';
        }

        // Find the classification with the highest count
        for (const [classification, count] of Object.entries(classificationCounts)) {
            if (count === maxCount) {
                return classification;
            }
        }

        return 'unknown';
    }

    /**
     * Get color for actor classification
     * @param {string} classification - Actor classification
     * @returns {string} CSS color class
     */
    static getClassificationColor(classification) {
        switch (classification) {
            case 'country':
            case 'region':
                return 'blue';
            case 'person':
                return 'green';
            case 'organization':
                return 'purple';
            default:
                return 'grey';
        }
    }

    /**
     * Get display label for classification
     * @param {string} classification - Actor classification
     * @returns {string} Human-readable label
     */
    static getClassificationLabel(classification) {
        switch (classification) {
            case 'country':
                return 'Country';
            case 'region':
                return 'Region';
            case 'person':
                return 'Person';
            case 'organization':
                return 'Organization';
            default:
                return 'Unknown';
        }
    }

    /**
     * Clear the classification cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Wikidata classification cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries())
        };
    }

    /**
     * Preload classifications for common entities
     */
    async preloadCommonEntities() {
        const commonEntities = [
            'United States', 'China', 'Russia', 'Germany', 'France', 'United Kingdom',
            'Japan', 'India', 'Brazil', 'Canada', 'Australia', 'Mexico',
            'European Union', 'NATO', 'United Nations', 'World Bank',
            'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla'
        ];

        console.log('Preloading common entity classifications...');
        await this.classifyActors(commonEntities);
        console.log(`Preloaded ${commonEntities.length} common entity classifications`);
    }
}

// Export for use in other modules
window.WikidataClassifier = WikidataClassifier;
