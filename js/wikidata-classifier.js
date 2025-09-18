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
        // Manual overrides for ambiguous names that should be prioritized as specific classifications
        this.manualOverrides = {
            // Countries
            'Israel': 'country',
            'Jordan': 'country', 
            'Georgia': 'country',
            'Chad': 'country',
            'Niger': 'country',
            'Mali': 'country',
            'Turkey': 'country',
            'Poland': 'country',
            'Hungary': 'country',
            'Cyprus': 'country',
            'Malta': 'country',
            'Monaco': 'country',
            'Andorra': 'country',
            'Luxembourg': 'country',
            'Liechtenstein': 'country',
            'San Marino': 'country',
            'Vatican': 'country',
            'Palestine': 'country',
            
            // Political Organizations
            'Hamas': 'political_organization',
            
            // Legislative Branch
            'Congress': 'legislative_branch',
            'Senate': 'legislative_branch',
            'House of Representatives': 'legislative_branch',
            'Parliament': 'legislative_branch',
            'House of Commons': 'legislative_branch',
            'House of Lords': 'legislative_branch',
            'National Assembly': 'legislative_branch',
            'Legislative Assembly': 'legislative_branch',
            'General Assembly': 'legislative_branch',
            'Bundestag': 'legislative_branch',
            'Bundesrat': 'legislative_branch',
            'Duma': 'legislative_branch',
            'Knesset': 'legislative_branch',
            'Diet': 'legislative_branch'
        };
        
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
            
            // Public Office Holders (specific category of people)
            'Q82955': 'public_office', // politician
            'Q372436': 'public_office', // statesperson
            'Q212071': 'public_office', // government official
            'Q1097498': 'public_office', // government minister
            'Q30461': 'public_office', // president
            'Q48352': 'public_office', // head of state
            'Q2285706': 'public_office', // head of government
            'Q189290': 'public_office', // military officer
            'Q193391': 'public_office', // ambassador
            'Q40348': 'public_office', // lawyer (in government context)
            'Q294126': 'public_office', // mayor
            'Q5096': 'public_office', // mayor
            
            // Legislative Branch (specific category for legislative bodies and members)
            'Q11204': 'legislative_branch', // parliament
            'Q35749': 'legislative_branch', // parliament
            'Q486839': 'legislative_branch', // senator
            'Q13218630': 'legislative_branch', // member of house of representatives
            'Q18018860': 'legislative_branch', // member of parliament
            'Q15647814': 'legislative_branch', // deputy
            'Q140686': 'legislative_branch', // chairperson (when in legislative context)
            'Q4164871': 'legislative_branch', // position held by head of parliament
            'Q1055894': 'legislative_branch', // governor (when in legislative role)
            'Q19546': 'legislative_branch', // prime minister (head of legislative in some systems)
            'Q1752346': 'legislative_branch', // cabinet (when legislative)
            'Q16707842': 'legislative_branch', // judge (when legislative function)
            'Q4261532': 'legislative_branch', // legislative assembly
            'Q1752346': 'legislative_branch', // government cabinet (when legislative)
            'Q217799': 'legislative_branch', // upper house
            'Q375928': 'legislative_branch', // lower house
            'Q1752346': 'legislative_branch', // legislative body
            'Q4261532': 'legislative_branch', // legislature
            
            // Political Organizations (specific category)
            'Q7278': 'political_organization', // political party
            'Q2659904': 'political_organization', // government organization
            'Q327333': 'political_organization', // government agency
            'Q1391145': 'political_organization', // international organization
            'Q1371037': 'political_organization', // military organization
            'Q61951': 'political_organization', // armed forces
            'Q15911314': 'political_organization', // political organization
            'Q2467461': 'political_organization', // government institution
            'Q4120211': 'political_organization', // regional government
            'Q16334295': 'political_organization', // group of politicians
            'Q2824523': 'political_organization', // political alliance
            'Q748019': 'political_organization', // political coalition
            
            // Regular Organizations
            'Q43229': 'organization', // organization
            'Q4830453': 'organization', // business
            'Q783794': 'organization', // company
            'Q891723': 'organization', // public company
            'Q1616075': 'organization', // private company
            'Q4830453': 'organization', // enterprise
            'Q163740': 'organization', // non-profit organization
            'Q31855': 'organization', // research institute
            'Q3918': 'organization', // university
            'Q875538': 'organization', // university
        };
    }

    /**
     * Normalize entity names to handle possessives, plurals, and other variations
     * @param {string} name - Original entity name
     * @returns {string} Normalized entity name
     */
    normalizeName(name) {
        if (!name || !name.trim()) return name;
        
        let normalized = name.trim();
        
        // Handle possessive forms (Qatar's -> Qatar, United States' -> United States)
        normalized = normalized.replace(/['']s?$/i, '');
        
        // Handle common plural forms for countries/organizations
        // But be careful not to break legitimate plurals like "Philippines" or "Netherlands"
        const preservePlurals = [
            'Philippines', 'Netherlands', 'Maldives', 'Seychelles', 'Bahamas', 
            'Comoros', 'Marshall Islands', 'Solomon Islands', 'Cayman Islands',
            'Virgin Islands', 'Falkland Islands', 'Cook Islands', 'Faroe Islands',
            'United States', 'United Nations', 'European Union', 'Arab Emirates',
            'Central African States', 'Pacific Islands'
        ];
        
        // Don't modify names that should keep their plural form
        const shouldPreservePlural = preservePlurals.some(preserve => 
            normalized.toLowerCase().includes(preserve.toLowerCase())
        );
        
        if (!shouldPreservePlural) {
            // Remove simple plural 's' for organizations/groups, but be conservative
            // Only do this for specific patterns that are likely to be pluralized entities
            if (/\b(government|minister|official|partie|compan|organization)s$/i.test(normalized)) {
                normalized = normalized.replace(/s$/i, '');
            }
            // Handle "ies" -> "y" (companies -> company, but not countries -> country)
            else if (/\b(compan|agenc)ies$/i.test(normalized)) {
                normalized = normalized.replace(/ies$/i, 'y');
            }
        }
        
        // Clean up extra whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();
        
        return normalized;
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

        const originalActor = actor.trim();
        const normalizedActor = this.normalizeName(originalActor);
        
        // Check manual overrides first (try both original and normalized)
        if (this.manualOverrides[originalActor]) {
            const override = this.manualOverrides[originalActor];
            this.cache.set(originalActor, override);
            return override;
        }
        if (this.manualOverrides[normalizedActor]) {
            const override = this.manualOverrides[normalizedActor];
            this.cache.set(originalActor, override);
            return override;
        }
        
        // Check cache (try both original and normalized)
        if (this.cache.has(originalActor)) {
            return this.cache.get(originalActor);
        }
        if (this.cache.has(normalizedActor)) {
            const cached = this.cache.get(normalizedActor);
            this.cache.set(originalActor, cached); // Cache the original form too
            return cached;
        }

        // Check if query is already pending (try both forms)
        if (this.pendingQueries.has(originalActor)) {
            return await this.pendingQueries.get(originalActor);
        }
        if (this.pendingQueries.has(normalizedActor)) {
            return await this.pendingQueries.get(normalizedActor);
        }

        // Create pending query promise - use normalized name for the actual query
        const queryPromise = this.performWikidataQuery(normalizedActor);
        this.pendingQueries.set(originalActor, queryPromise);
        if (normalizedActor !== originalActor) {
            this.pendingQueries.set(normalizedActor, queryPromise);
        }

        try {
            const result = await queryPromise;
            this.cache.set(originalActor, result);
            if (normalizedActor !== originalActor) {
                this.cache.set(normalizedActor, result);
            }
            this.pendingQueries.delete(originalActor);
            this.pendingQueries.delete(normalizedActor);
            return result;
        } catch (error) {
            console.warn(`Failed to classify actor: ${originalActor}`, error);
            this.pendingQueries.delete(originalActor);
            this.pendingQueries.delete(normalizedActor);
            this.cache.set(originalActor, 'unknown');
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
            public_office: 0,
            political_organization: 0,
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

        // Return the most common classification, with priority for geopolitical entities
        const maxCount = Math.max(...Object.values(classificationCounts));
        if (maxCount === 0) {
            return 'unknown';
        }

        // Priority order: country > region > legislative_branch > political_organization > public_office > organization > person
        const priorityOrder = ['country', 'region', 'legislative_branch', 'political_organization', 'public_office', 'organization', 'person'];
        
        // If there are ties, prioritize based on our priority order
        for (const classification of priorityOrder) {
            if (classificationCounts[classification] === maxCount) {
                return classification;
            }
        }

        // Fallback to first classification with max count
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
            case 'public_office':
                return 'green'; // Same as person since it maps to person
            case 'legislative_branch':
                return 'orange'; // Distinct color for legislative entities
            case 'political_organization':
                return 'red';
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
            case 'public_office':
                return 'Public Office';
            case 'legislative_branch':
                return 'Legislative Branch';
            case 'political_organization':
                return 'Political Organization';
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
            'Japan', 'India', 'Brazil', 'Canada', 'Australia', 'Mexico', 'Israel',
            'Jordan', 'Egypt', 'Saudi Arabia', 'Iran', 'Iraq', 'Turkey', 'Greece',
            'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
            'European Union', 'NATO', 'United Nations', 'World Bank',
            'Democratic Party', 'Republican Party', 'Conservative Party', 'Labour Party',
            'Congress', 'Senate', 'Parliament', 'CIA', 'FBI', 'Pentagon',
            'Joe Biden', 'Donald Trump', 'Barack Obama', 'Xi Jinping', 'Vladimir Putin',
            'Emmanuel Macron', 'Angela Merkel', 'Justin Trudeau', 'Boris Johnson',
            'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla'
        ];

        console.log('Preloading common entity classifications...');
        await this.classifyActors(commonEntities);
        console.log(`Preloaded ${commonEntities.length} common entity classifications`);
    }
}

// Export for use in other modules
window.WikidataClassifier = WikidataClassifier;
