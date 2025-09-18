/**
 * Actor Pill Renderer Module
 * Handles rendering of actor pills with Wikidata classifications
 */

class ActorPillRenderer {
    constructor() {
        this.wikidataClassifier = new WikidataClassifier();
        this.actorClassifications = new Map();
        this.isClassifying = false;
    }

    /**
     * Initialize actor classifications for a dataset
     * @param {Array<Object>} data - Array of data objects
     */
    async initializeClassifications(data) {
        if (this.isClassifying) return;
        
        this.isClassifying = true;
        
        try {
            // Extract all unique actors, including comma-separated values
            const actorSet = new Set();
            
            data.forEach(row => {
                // Process Actor field
                if (row.Actor && row.Actor.trim()) {
                    const actors = row.Actor.split(',').map(a => a.trim()).filter(a => a.length > 0);
                    actors.forEach(actor => actorSet.add(actor));
                }
                
                // Process Target field (targets can also be actors)
                if (row.Target && row.Target.trim()) {
                    const targets = row.Target.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    targets.forEach(target => actorSet.add(target));
                }
            });
            
            const actors = [...actorSet];
            
            if (actors.length === 0) {
                this.isClassifying = false;
                return;
            }

            console.log(`Initializing actor classifications for ${actors.length} unique actors (including comma-separated values)`);
            
            // Preload common entities first
            await this.wikidataClassifier.preloadCommonEntities();
            
            // Classify all actors
            const classifications = await this.wikidataClassifier.classifyActors(actors);
            this.actorClassifications = classifications;
            
            console.log('Actor classifications completed:', this.actorClassifications);
            
            // Trigger UI update
            this.notifyClassificationComplete();
            
        } catch (error) {
            console.error('Error initializing actor classifications:', error);
        } finally {
            this.isClassifying = false;
        }
    }

    /**
     * Render an actor pill
     * @param {string} actor - Actor name
     * @param {string} size - Pill size: 'normal', 'table', or 'popup'
     * @returns {string} HTML for actor pill
     */
    renderActorPill(actor, size = 'normal') {
        if (!actor || !actor.trim()) return '';

        const classification = this.actorClassifications.get(actor) || 'unknown';
        const color = WikidataClassifier.getClassificationColor(classification);
        const label = WikidataClassifier.getClassificationLabel(classification);
        const icon = this.getClassificationIcon(classification);
        
        const sizeClass = size === 'table' ? 'table-actor-pill' : 
                         size === 'popup' ? 'popup-actor-pill' : 
                         'actor-pill';
        
        const isLoading = this.isClassifying && !this.actorClassifications.has(actor);
        const loadingClass = isLoading ? ' actor-pill-loading' : '';
        
        return `
            <span class="${sizeClass} actor-pill-${color}${loadingClass}" 
                  title="${actor} (${label})" 
                  data-actor="${actor}" 
                  data-classification="${classification}">
                <span class="actor-pill-icon">${icon}</span>
                <span>${actor}</span>
            </span>
        `;
    }

    /**
     * Render actor pills from comma-separated string
     * @param {string} actorsString - Comma-separated actor names
     * @param {string} size - Pill size: 'normal', 'table', or 'popup'
     * @returns {string} HTML for all actor pills
     */
    renderActorPillsFromString(actorsString, size = 'normal') {
        if (!actorsString || !actorsString.trim()) return '';
        
        // Split by comma and clean up each actor name
        const actors = actorsString.split(',')
            .map(actor => actor.trim())
            .filter(actor => actor.length > 0);
        
        return actors.map(actor => this.renderActorPill(actor, size)).join('');
    }

    /**
     * Render multiple actor pills
     * @param {Array<string>} actors - Array of actor names
     * @param {string} size - Pill size
     * @returns {string} HTML for all actor pills
     */
    renderActorPills(actors, size = 'normal') {
        if (!actors || !Array.isArray(actors)) return '';
        
        return actors
            .filter(actor => actor && actor.trim())
            .map(actor => this.renderActorPill(actor, size))
            .join('');
    }

    /**
     * Render actor pills container with label
     * @param {Array<string>} actors - Array of actor names
     * @param {string} label - Container label
     * @returns {string} HTML for pills container
     */
    renderActorPillsContainer(actors, label = 'Actors') {
        if (!actors || actors.length === 0) return '';

        return `
            <div class="actor-pills-container">
                <div class="actor-pills-label">${label}:</div>
                ${this.renderActorPills(actors)}
            </div>
        `;
    }

    /**
     * Get icon for classification
     * @param {string} classification - Actor classification
     * @returns {string} Icon character
     */
    getClassificationIcon(classification) {
        switch (classification) {
            case 'country':
                return '🏛️';
            case 'region':
                return '🏙️';
            case 'person':
                return '👤';
            case 'organization':
                return '🏢';
            default:
                return '❓';
        }
    }

    /**
     * Update actor pill display after classification
     * @param {string} actor - Actor name
     */
    updateActorPillDisplay(actor) {
        const elements = document.querySelectorAll(`[data-actor="${actor}"]`);
        elements.forEach(element => {
            const classification = this.actorClassifications.get(actor) || 'unknown';
            const color = WikidataClassifier.getClassificationColor(classification);
            const label = WikidataClassifier.getClassificationLabel(classification);
            const icon = this.getClassificationIcon(classification);
            
            // Remove loading class
            element.classList.remove('actor-pill-loading');
            
            // Update color class
            element.className = element.className.replace(/actor-pill-(blue|green|purple|grey)/, `actor-pill-${color}`);
            
            // Update title
            element.title = `${actor} (${label})`;
            element.setAttribute('data-classification', classification);
            
            // Update icon
            const iconElement = element.querySelector('.actor-pill-icon');
            if (iconElement) {
                iconElement.textContent = icon;
            }
        });
    }

    /**
     * Notify that classification is complete and update UI
     */
    notifyClassificationComplete() {
        // Update all existing pills
        this.actorClassifications.forEach((classification, actor) => {
            this.updateActorPillDisplay(actor);
        });

        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('actorClassificationComplete', {
            detail: { classifications: this.actorClassifications }
        }));
    }

    /**
     * Get classification statistics
     * @returns {Object} Statistics about classifications
     */
    getClassificationStats() {
        const stats = {
            total: this.actorClassifications.size,
            country: 0,
            region: 0,
            person: 0,
            organization: 0,
            unknown: 0
        };

        this.actorClassifications.forEach(classification => {
            stats[classification] = (stats[classification] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear all classifications
     */
    clearClassifications() {
        this.actorClassifications.clear();
        this.wikidataClassifier.clearCache();
    }

    /**
     * Check if actor is classified
     * @param {string} actor - Actor name
     * @returns {boolean} True if actor is classified
     */
    isActorClassified(actor) {
        return this.actorClassifications.has(actor);
    }

    /**
     * Get actor classification
     * @param {string} actor - Actor name
     * @returns {string} Classification or 'unknown'
     */
    getActorClassification(actor) {
        return this.actorClassifications.get(actor) || 'unknown';
    }

    /**
     * Filter actors by classification
     * @param {Array<string>} actors - Array of actor names
     * @param {string} classification - Classification to filter by
     * @returns {Array<string>} Filtered actors
     */
    filterActorsByClassification(actors, classification) {
        return actors.filter(actor => this.getActorClassification(actor) === classification);
    }

    /**
     * Group actors by classification
     * @param {Array<string>} actors - Array of actor names
     * @returns {Object} Grouped actors by classification
     */
    groupActorsByClassification(actors) {
        const groups = {
            country: [],
            region: [],
            person: [],
            organization: [],
            unknown: []
        };

        actors.forEach(actor => {
            const classification = this.getActorClassification(actor);
            if (groups[classification]) {
                groups[classification].push(actor);
            }
        });

        return groups;
    }
}

// Export for use in other modules
window.ActorPillRenderer = ActorPillRenderer;
