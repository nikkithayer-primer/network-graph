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
                  title="${actor} (${label}) - Click for details" 
                  data-actor="${actor}" 
                  data-classification="${classification}"
                  style="cursor: pointer;"
                  onclick="ActorPillRenderer.handleActorPillClick(event, '${actor.replace(/'/g, "\\'")}')">
                
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
            case 'public_office':
                return '👔'; // Business suit to represent public officials
            case 'political_organization':
                return '🗳️';
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
            element.className = element.className.replace(/actor-pill-(blue|green|red|purple|grey)/, `actor-pill-${color}`);
            
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
            public_office: 0,
            political_organization: 0,
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
            public_office: [],
            political_organization: [],
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

    /**
     * Static method to handle actor pill clicks
     * @param {Event} event - Click event
     * @param {string} actorName - Name of the clicked actor
     */
    static handleActorPillClick(event, actorName) {
        event.stopPropagation(); // Prevent event bubbling
        
        // Always show the same consistent popover as network graph (name + sentence count)
        ActorPillRenderer.showConsistentActorPopover(event, actorName);
    }

    /**
     * Static method to handle actor pill double-clicks (opens full profile modal)
     * @param {Event} event - Double-click event
     * @param {string} actorName - Name of the clicked actor
     */
    static handleActorPillDoubleClick(event, actorName) {
        event.stopPropagation(); // Prevent event bubbling
        
        if (window.app && window.app.politicalDataManager && window.app.profilePage) {
            // First try to get knowledge base data
            const knowledgeBaseData = window.app.politicalDataManager.getEntityFromKnowledgeBase(actorName);
            
            if (knowledgeBaseData) {
                // Show profile for knowledge base entity
                const relatedSentences = ActorPillRenderer.getRelatedSentences(actorName);
                window.app.profilePage.showProfile(knowledgeBaseData, relatedSentences);
                return;
            }

            // Fall back to political figure data
            const profileData = window.app.politicalDataManager.getProfileData(actorName);
            
            if (profileData) {
                // Show political figure profile
                window.app.profilePage.showProfile(profileData);
                return;
            }

            // Create enhanced profile for entities not in knowledge base
            const basicProfile = ActorPillRenderer.createEnhancedProfile(actorName);
            const relatedSentences = ActorPillRenderer.getRelatedSentences(actorName);
            window.app.profilePage.showProfile(basicProfile, relatedSentences);
        } else {
            // Fallback: show enhanced popover if profile system not available
            ActorPillRenderer.showEnhancedActorPopover(event, actorName);
        }
    }

    /**
     * Create enhanced profile with network data for non-political figures
     * @param {string} actorName - Name of the actor
     * @returns {Object} Enhanced profile data
     */
    static createEnhancedProfile(actorName) {
        const networkData = ActorPillRenderer.getNetworkDataForActor(actorName);
        const classification = window.app.actorPillRenderer ? 
            window.app.actorPillRenderer.getActorClassification(actorName) : 'unknown';

        return {
            id: actorName,
            name: actorName,
            profileType: 'enhanced_entity',
            classification: classification,
            networkData: networkData,
            connectionCount: networkData.connections.length,
            actorCount: networkData.asActorCount,
            targetCount: networkData.asTargetCount
        };
    }

    /**
     * Get network relationship data for an actor
     * @param {string} actorName - Name of the actor
     * @returns {Object} Network data including connections and statistics
     */
    static getNetworkDataForActor(actorName) {
        const networkData = {
            connections: [],
            asActorCount: 0,
            asTargetCount: 0,
            uniquePartners: new Set(),
            commonActions: new Map(),
            locations: new Set()
        };

        // Try to get network graph data if available
        if (window.ViewRenderers && window.ViewRenderers.networkGraphRenderer) {
            const renderer = window.ViewRenderers.networkGraphRenderer;
            
            // Find connections where this actor is involved
            if (renderer.nodes && renderer.links) {
                const actorNode = renderer.nodes.find(node => node.id === actorName || node.name === actorName);
                
                if (actorNode) {
                    // Get direct connections
                    renderer.links.forEach(link => {
                        const isSource = (link.source.id || link.source) === actorName;
                        const isTarget = (link.target.id || link.target) === actorName;
                        
                        if (isSource || isTarget) {
                            const partner = isSource ? (link.target.id || link.target) : (link.source.id || link.source);
                            const relationship = isSource ? 'acts_on' : 'acted_upon_by';
                            
                            networkData.connections.push({
                                partner: partner,
                                relationship: relationship,
                                count: link.count || 1,
                                actions: Array.from(link.actions || []),
                                records: link.records || []
                            });
                            
                            networkData.uniquePartners.add(partner);
                            
                            // Count actions
                            if (link.actions) {
                                link.actions.forEach(action => {
                                    networkData.commonActions.set(action, (networkData.commonActions.get(action) || 0) + 1);
                                });
                            }
                        }
                    });
                }
            }
        }

        // Get CSV data regardless of network graph availability
        const csvData = ActorPillRenderer.getRelatedSentences(actorName);
        csvData.forEach(record => {
            const actors = record.Actor ? record.Actor.split(',').map(a => a.trim()) : [];
            const targets = record.Target ? record.Target.split(',').map(t => t.trim()) : [];
            
            if (actors.includes(actorName)) {
                networkData.asActorCount++;
                targets.forEach(target => networkData.uniquePartners.add(target));
            }
            if (targets.includes(actorName)) {
                networkData.asTargetCount++;
                actors.forEach(actor => networkData.uniquePartners.add(actor));
            }
            
            if (record.Action) {
                networkData.commonActions.set(record.Action, (networkData.commonActions.get(record.Action) || 0) + 1);
            }
            
            if (record.Location) {
                networkData.locations.add(record.Location);
            }
        });

        return networkData;
    }

    /**
     * Get sentences related to an actor from current data
     * @param {string} actorName - Name of the actor
     * @returns {Array<Object>} Related sentences
     */
    static getRelatedSentences(actorName) {
        if (!window.app || !window.app.dataManager) {
            return [];
        }

        const allData = window.app.dataManager.getOriginalData();
        return allData.filter(record => {
            const actors = record.Actor ? record.Actor.split(',').map(a => a.trim()) : [];
            const targets = record.Target ? record.Target.split(',').map(t => t.trim()) : [];
            
            return actors.includes(actorName) || targets.includes(actorName);
        });
    }

    /**
     * Show consistent popover for actors (same style as network graph)
     * @param {Event} event - Click event
     * @param {string} actorName - Name of the actor
     */
    static showConsistentActorPopover(event, actorName) {
        // Remove any existing popovers
        const existingPopover = document.querySelector('.network-popover');
        if (existingPopover) {
            existingPopover.remove();
        }

        // Get sentences for this actor (same as network graph)
        const sentences = ActorPillRenderer.getSentencesForActor(actorName);
        const classification = window.app?.actorPillRenderer?.getActorClassification(actorName) || 'unknown';
        const classificationLabel = window.WikidataClassifier?.getClassificationLabel(classification) || 'Unknown';
        
        // Create popover with same styling as network graph
        const popover = document.createElement('div');
        popover.className = 'network-popover';
        popover.style.cssText = `
            position: absolute;
            visibility: visible;
            background-color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--bg-white') : 'white'};
            border: 1px solid ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--border-light') : '#e5e7eb'};
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            max-width: 400px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1001;
            pointer-events: auto;
        `;

        let popoverContent;
        
        if (sentences.length === 0) {
            popoverContent = `
                <div style="font-weight: 600; margin-bottom: 8px; padding-right: 20px;">${actorName}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${classificationLabel}</div>
                <div style="color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--text-secondary') : '#6b7280'}; font-style: italic;">No sentences found for this actor.</div>
                <div class="popover-close" style="position: absolute; top: 8px; right: 12px; cursor: pointer; font-size: 18px; color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--text-secondary') : '#6b7280'}; font-weight: bold;">×</div>
            `;
        } else {
            popoverContent = `
                <div style="font-weight: 600; margin-bottom: 8px; padding-right: 20px;">${actorName}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${classificationLabel}</div>
                <div style="font-size: 12px; color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--text-secondary') : '#6b7280'}; margin-bottom: 12px;">
                    ${sentences.length} sentence${sentences.length !== 1 ? 's' : ''} found
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${sentences.map((sentence, index) => `
                        <div style="margin-bottom: 12px; padding: 8px; background-color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--bg-light') : '#f9fafb'}; border-radius: 4px; border-left: 3px solid ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--action-blue') : '#3b82f6'};">
                            <div style="font-size: 13px; line-height: 1.4;">${sentence}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="popover-close" style="position: absolute; top: 8px; right: 12px; cursor: pointer; font-size: 18px; color: ${window.CSSUtils ? window.CSSUtils.getCSSVariable('--text-secondary') : '#6b7280'}; font-weight: bold;">×</div>
            `;
        }
        
        popover.innerHTML = popoverContent;
        document.body.appendChild(popover);
        
        // Add close button functionality
        const closeButton = popover.querySelector('.popover-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                popover.remove();
            });
        }

        // Position the popover using PopoverUtils if available
        if (window.PopoverUtils) {
            const mockSelection = { 
                node: () => popover, 
                style: (prop, val) => { 
                    if (val !== undefined) {
                        popover.style[prop] = val; 
                        return mockSelection; 
                    }
                    return popover.style[prop];
                } 
            };
            window.PopoverUtils.positionEventPopover(mockSelection, event);
        } else {
            // Fallback positioning
            popover.style.left = Math.min(event.pageX + 10, window.innerWidth - 420) + 'px';
            popover.style.top = Math.max(event.pageY - 50, 10) + 'px';
        }

        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePopover(e) {
                if (!popover.contains(e.target)) {
                    popover.remove();
                    document.removeEventListener('click', closePopover);
                }
            });
        }, 100);
    }

    /**
     * Get sentences related to a specific actor (same logic as network graph)
     * @param {string} actorName - Name of the actor
     * @returns {Array<string>} Array of sentences
     */
    static getSentencesForActor(actorName) {
        const sentences = [];
        
        if (!window.app || !window.app.dataManager) {
            return sentences;
        }

        const allData = window.app.dataManager.getOriginalData();
        allData.forEach(record => {
            const actors = record.Actor ? record.Actor.split(',').map(a => a.trim()) : [];
            const targets = record.Target ? record.Target.split(',').map(t => t.trim()) : [];
            
            if (actors.includes(actorName) || targets.includes(actorName)) {
                if (record.Sentence && record.Sentence.trim()) {
                    sentences.push(record.Sentence.trim());
                }
            }
        });
        
        // Remove duplicates
        return [...new Set(sentences)];
    }

    /**
     * Show enhanced popover for actors (legacy method - kept for compatibility)
     * @param {Event} event - Click event
     * @param {string} actorName - Name of the actor
     */
    static showEnhancedActorPopover(event, actorName) {
        // Remove any existing popovers
        const existingPopover = document.querySelector('.enhanced-actor-popover');
        if (existingPopover) {
            existingPopover.remove();
        }

        // Get enhanced data
        const networkData = ActorPillRenderer.getNetworkDataForActor(actorName);
        const relatedSentences = ActorPillRenderer.getRelatedSentences(actorName);
        const classification = window.app?.actorPillRenderer?.getActorClassification(actorName) || 'unknown';
        const classificationLabel = window.WikidataClassifier?.getClassificationLabel(classification) || 'Unknown';

        // Create enhanced popover
        const popover = document.createElement('div');
        popover.className = 'enhanced-actor-popover';
        popover.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 0;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-width: 400px;
            max-height: 500px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        `;

        // Build content sections
        let content = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; position: relative;">
                <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px; padding-right: 30px;">${actorName}</div>
                <div style="font-size: 12px; opacity: 0.9;">${classificationLabel}</div>
                <div style="position: absolute; top: 12px; right: 16px; cursor: pointer; font-size: 20px; opacity: 0.8; font-weight: bold;" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
            <div style="padding: 16px;">
        `;

        // Network statistics
        const uniquePartners = Array.from(networkData.uniquePartners);
        const topActions = Array.from(networkData.commonActions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (uniquePartners.length > 0 || networkData.asActorCount > 0 || networkData.asTargetCount > 0) {
            content += `
                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #374151;">Network Overview</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
                        <div style="text-align: center; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                            <div style="font-size: 18px; font-weight: 600; color: #059669;">${uniquePartners.length}</div>
                            <div style="font-size: 11px; color: #6b7280;">Connections</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                            <div style="font-size: 18px; font-weight: 600; color: #dc2626;">${networkData.asActorCount}</div>
                            <div style="font-size: 11px; color: #6b7280;">As Actor</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: #f3f4f6; border-radius: 6px;">
                            <div style="font-size: 18px; font-weight: 600; color: #2563eb;">${networkData.asTargetCount}</div>
                            <div style="font-size: 11px; color: #6b7280;">As Target</div>
                        </div>
                    </div>
                </div>
            `;

            // Top connections
            if (networkData.connections.length > 0) {
                const topConnections = networkData.connections
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);

                content += `
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px; color: #374151;">Top Connections</div>
                        ${topConnections.map(conn => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #fef3c7; border-radius: 4px; margin-bottom: 4px;">
                                <span style="font-size: 13px; font-weight: 500;">${conn.partner}</span>
                                <span style="font-size: 11px; color: #92400e; background: #fbbf24; padding: 2px 6px; border-radius: 10px;">${conn.count}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Common actions
            if (topActions.length > 0) {
                content += `
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px; color: #374151;">Common Actions</div>
                        <div style="display: flex; flex-wrap: gap; gap: 4px;">
                            ${topActions.map(([action, count]) => `
                                <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 12px;">
                                    ${action} (${count})
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Locations
            if (networkData.locations.size > 0) {
                const locationList = Array.from(networkData.locations).slice(0, 5);
                content += `
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px; color: #374151;">Locations</div>
                        <div style="font-size: 12px; color: #6b7280;">
                            ${locationList.join(', ')}${networkData.locations.size > 5 ? ` +${networkData.locations.size - 5} more` : ''}
                        </div>
                    </div>
                `;
            }
        }

        // Recent activities
        if (relatedSentences.length > 0) {
            content += `
                <div>
                    <div style="font-weight: 500; margin-bottom: 8px; color: #374151;">
                        Recent Activities (${relatedSentences.length})
                    </div>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${relatedSentences.slice(0, 3).map(record => `
                            <div style="margin-bottom: 8px; padding: 8px; background-color: #f9fafb; border-radius: 6px; font-size: 12px; line-height: 1.4;">
                                <div style="font-weight: 500; margin-bottom: 2px;">${record.Action || 'Unknown Action'}</div>
                                <div style="color: #6b7280;">${record.Sentence || 'No description available'}</div>
                                ${record.DateTime ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">${record.DateTime}</div>` : ''}
                            </div>
                        `).join('')}
                        ${relatedSentences.length > 3 ? `
                            <div style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 8px; font-style: italic;">
                                ...and ${relatedSentences.length - 3} more activities
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            content += `
                <div style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">
                    No related activities found
                </div>
            `;
        }

        content += '</div>'; // Close padding div

        popover.innerHTML = content;
        document.body.appendChild(popover);

        // Position the popover using PopoverUtils if available
        if (window.PopoverUtils) {
            window.PopoverUtils.positionEventPopover(
                { node: () => popover, style: (prop, val) => { popover.style[prop] = val; return popover; } },
                event
            );
        } else {
            // Fallback positioning
            popover.style.left = Math.min(event.pageX + 10, window.innerWidth - 420) + 'px';
            popover.style.top = Math.max(event.pageY - 50, 10) + 'px';
        }

        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePopover(e) {
                if (!popover.contains(e.target)) {
                    popover.remove();
                    document.removeEventListener('click', closePopover);
                }
            });
        }, 100);
    }
}

// Export for use in other modules
window.ActorPillRenderer = ActorPillRenderer;
