/**
 * Profile Page Module
 * Handles rendering detailed profile pages for political figures and other entities
 */

class ProfilePage {
    constructor() {
        this.currentProfile = null;
        this.isVisible = false;
    }

    /**
     * Show profile page for a given entity
     * @param {Object} profileData - Profile data object
     * @param {Array<Object>} csvData - Related CSV data
     */
    showProfile(profileData, csvData = []) {
        this.currentProfile = profileData;
        this.createProfileModal(profileData, csvData);
        this.isVisible = true;
    }

    /**
     * Create and display the profile modal
     * @param {Object} profileData - Profile data object
     * @param {Array<Object>} csvData - Related CSV data
     */
    createProfileModal(profileData, csvData) {
        // Remove existing modal if present
        this.hideProfile();

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'profile-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        `;

        // Generate modal content
        modal.innerHTML = this.generateProfileHTML(profileData, csvData);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add event listeners
        this.addProfileEventListeners(overlay, modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Generate HTML content for the profile
     * @param {Object} profileData - Profile data object
     * @param {Array<Object>} csvData - Related CSV data
     * @returns {string} HTML content
     */
    generateProfileHTML(profileData, csvData) {
        const isPoliticalFigure = profileData.profileType === 'political_figure';
        const isEnhancedEntity = profileData.profileType === 'enhanced_entity';
        const isKnowledgeBaseEntity = profileData.source === 'knowledge_base';
        
        return `
            <div class="profile-header">
                <button class="profile-close" aria-label="Close profile">×</button>
                <div class="profile-title-section">
                    <h2 class="profile-name">${profileData.id || profileData.name}</h2>
                    ${isPoliticalFigure || isKnowledgeBaseEntity ? `
                        <div class="profile-role">${profileData.role || this.getClassificationLabel(profileData.classification)}</div>
                        <div class="profile-meta">
                            ${profileData.state ? `<span class="profile-state">📍 ${profileData.state}</span>` : ''}
                            ${isPoliticalFigure ? this.getPartyBadge(profileData) : ''}
                            ${isKnowledgeBaseEntity ? `<span class="profile-source">📚 Knowledge Base</span>` : ''}
                        </div>
                    ` : isEnhancedEntity ? `
                        <div class="profile-role">${this.getClassificationLabel(profileData.classification)}</div>
                        <div class="profile-meta">
                            ${profileData.connectionCount ? `<span class="profile-connections">🔗 ${profileData.connectionCount} connections</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="profile-content">
                ${isEnhancedEntity ? this.generateNetworkOverviewSection(profileData) : ''}
                ${isKnowledgeBaseEntity ? this.generateKnowledgeBaseSection(profileData) : ''}
                ${this.generateBasicInfoSection(profileData)}
                ${this.generateOrganizationsSection(profileData)}
                ${this.generateConnectionsSection(profileData)}
                ${this.generateEventsSection(profileData)}
                ${this.generateQuotesSection(profileData)}
                ${this.generateRelatedSentencesSection(profileData, csvData)}
            </div>
        `;
    }

    /**
     * Generate basic information section
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateBasicInfoSection(profileData) {
        if (!profileData.alternate_names || profileData.alternate_names.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Also Known As</h3>
                <div class="profile-alternate-names">
                    ${profileData.alternate_names.map(name => 
                        `<span class="alternate-name-tag">${name}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate organizations section
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateOrganizationsSection(profileData) {
        if (!profileData.organizations || profileData.organizations.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Organizations</h3>
                <div class="profile-organizations">
                    ${profileData.organizations.map(org => `
                        <div class="organization-item">
                            <div class="org-name">${org.name}</div>
                            <div class="org-relationship">${org.relationship}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate connections section
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateConnectionsSection(profileData) {
        if (!profileData.connections || profileData.connections.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Political Connections</h3>
                <div class="profile-connections">
                    ${profileData.connections.map(conn => `
                        <div class="connection-item">
                            <div class="connection-target">${conn.target}</div>
                            <div class="connection-relationship">${conn.relationship}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate events section
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateEventsSection(profileData) {
        if (!profileData.events || profileData.events.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Recent Events</h3>
                <div class="profile-events">
                    ${profileData.events.map(event => `
                        <div class="event-item">
                            <div class="event-name">${event.name}</div>
                            <div class="event-details">
                                <span class="event-relationship">${event.relationship}</span>
                                ${event.datetime || event.date ? `
                                    <span class="event-date">📅 ${this.formatDateTime(event.datetime || event.date)}</span>
                                ` : ''}
                                ${event.location ? `
                                    <span class="event-location">📍 ${event.location}</span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate quotes section
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateQuotesSection(profileData) {
        if (!profileData.quotes || profileData.quotes.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Recent Quotes</h3>
                <div class="profile-quotes">
                    ${profileData.quotes.map(quote => `
                        <div class="quote-item">
                            <div class="quote-text">"${quote.text}"</div>
                            <div class="quote-attribution">
                                ${quote.datetime || quote.date ? `
                                    <span class="quote-date">${this.formatDateTime(quote.datetime || quote.date)}</span>
                                ` : ''}
                                ${quote.source ? `
                                    <span class="quote-source">— ${quote.source}</span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate related sentences section from CSV data
     * @param {Object} profileData - Profile data object
     * @param {Array<Object>} csvData - Related CSV data
     * @returns {string} HTML content
     */
    generateRelatedSentencesSection(profileData, csvData) {
        const relatedSentences = profileData.relatedSentences || csvData;
        
        if (!relatedSentences || relatedSentences.length === 0) {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Related Activity</h3>
                <div class="profile-sentences">
                    ${relatedSentences.map(record => `
                        <div class="sentence-item">
                            <div class="sentence-text">${record.Sentence || 'No description available'}</div>
                            <div class="sentence-details">
                                ${record.Action ? `<span class="sentence-action">${record.Action}</span>` : ''}
                                ${record.Datetimes || record['Date Received'] ? `
                                    <span class="sentence-date">📅 ${this.formatDateTime(record.Datetimes || record['Date Received'])}</span>
                                ` : ''}
                                ${record.Locations ? `
                                    <span class="sentence-location">📍 ${record.Locations}</span>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get party badge HTML
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML for party badge
     */
    getPartyBadge(profileData) {
        if (!profileData.organizations) return '';
        
        for (const org of profileData.organizations) {
            if (org.name.includes('Democratic Party')) {
                return '<span class="party-badge democratic">Democratic</span>';
            }
            if (org.name.includes('Republican Party')) {
                return '<span class="party-badge republican">Republican</span>';
            }
        }
        
        return '<span class="party-badge independent">Independent</span>';
    }

    /**
     * Format datetime for display
     * @param {string} datetime - Datetime string
     * @returns {string} Formatted datetime
     */
    formatDateTime(datetime) {
        if (!datetime) return '';
        
        try {
            const date = new Date(datetime);
            if (isNaN(date.getTime())) return datetime;
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return datetime;
        }
    }

    /**
     * Add event listeners to the profile modal
     * @param {HTMLElement} overlay - Modal overlay element
     * @param {HTMLElement} modal - Modal content element
     */
    addProfileEventListeners(overlay, modal) {
        // Close button
        const closeBtn = modal.querySelector('.profile-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideProfile());
        }

        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideProfile();
            }
        });

        // Escape key to close
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideProfile();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Prevent modal content clicks from closing
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Hide the profile modal
     */
    hideProfile() {
        const overlay = document.querySelector('.profile-modal-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        this.currentProfile = null;
        this.isVisible = false;
    }

    /**
     * Check if profile is currently visible
     * @returns {boolean} True if profile is visible
     */
    isProfileVisible() {
        return this.isVisible;
    }

    /**
     * Get current profile data
     * @returns {Object|null} Current profile data
     */
    getCurrentProfile() {
        return this.currentProfile;
    }

    /**
     * Generate network overview section for enhanced entities
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateNetworkOverviewSection(profileData) {
        if (!profileData.networkData) return '';

        const networkData = profileData.networkData;
        const uniquePartners = Array.from(networkData.uniquePartners);
        const topActions = Array.from(networkData.commonActions.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Network Overview</h3>
                <div class="profile-section-content">
                    <div class="network-stats">
                        <div class="network-stat">
                            <div class="network-stat-value">${uniquePartners.length}</div>
                            <div class="network-stat-label">Unique Connections</div>
                        </div>
                        <div class="network-stat">
                            <div class="network-stat-value">${networkData.asActorCount}</div>
                            <div class="network-stat-label">Times as Actor</div>
                        </div>
                        <div class="network-stat">
                            <div class="network-stat-value">${networkData.asTargetCount}</div>
                            <div class="network-stat-label">Times as Target</div>
                        </div>
                    </div>
                    
                    ${topActions.length > 0 ? `
                        <div class="network-actions">
                            <h4>Most Common Actions</h4>
                            <div class="action-tags">
                                ${topActions.map(([action, count]) => `
                                    <span class="action-tag">${action} (${count})</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${networkData.locations.size > 0 ? `
                        <div class="network-locations">
                            <h4>Associated Locations</h4>
                            <div class="location-list">
                                ${Array.from(networkData.locations).slice(0, 10).join(', ')}
                                ${networkData.locations.size > 10 ? ` +${networkData.locations.size - 10} more` : ''}
                            </div>
                        </div>
                    ` : ''}

                    ${networkData.connections.length > 0 ? `
                        <div class="network-connections">
                            <h4>Top Connections</h4>
                            <div class="connection-list">
                                ${networkData.connections
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 5)
                                    .map(conn => `
                                        <div class="connection-item">
                                            <span class="connection-name">${conn.partner}</span>
                                            <span class="connection-count">${conn.count} interaction${conn.count !== 1 ? 's' : ''}</span>
                                            <span class="connection-type">${conn.relationship === 'acts_on' ? '→' : '←'}</span>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get classification label for entity types
     * @param {string} classification - Entity classification
     * @returns {string} Human-readable label
     */
    getClassificationLabel(classification) {
        if (window.WikidataClassifier && window.WikidataClassifier.getClassificationLabel) {
            return window.WikidataClassifier.getClassificationLabel(classification);
        }
        
        // Fallback labels
        const labels = {
            'person': 'Person',
            'organization': 'Organization',
            'country': 'Country',
            'region': 'Region',
            'public_office': 'Public Office',
            'political_organization': 'Political Organization',
            'unknown': 'Unknown Entity'
        };
        
        return labels[classification] || 'Unknown Entity';
    }

    /**
     * Generate knowledge base section for entities from the knowledge base
     * @param {Object} profileData - Profile data object
     * @returns {string} HTML content
     */
    generateKnowledgeBaseSection(profileData) {
        if (!profileData || profileData.source !== 'knowledge_base') {
            return '';
        }

        return `
            <div class="profile-section">
                <h3 class="profile-section-title">Knowledge Base Information</h3>
                <div class="profile-section-content">
                    <div class="kb-info-grid">
                        ${profileData.role ? `
                            <div class="kb-info-item">
                                <span class="kb-info-label">Role:</span>
                                <span class="kb-info-value">${profileData.role}</span>
                            </div>
                        ` : ''}
                        
                        ${profileData.party ? `
                            <div class="kb-info-item">
                                <span class="kb-info-label">Party:</span>
                                <span class="kb-info-value">${profileData.party}</span>
                            </div>
                        ` : ''}
                        
                        ${profileData.state ? `
                            <div class="kb-info-item">
                                <span class="kb-info-label">State:</span>
                                <span class="kb-info-value">${profileData.state}</span>
                            </div>
                        ` : ''}
                        
                        <div class="kb-info-item">
                            <span class="kb-info-label">Classification:</span>
                            <span class="kb-info-value">${this.getClassificationLabel(profileData.classification)}</span>
                        </div>
                        
                        <div class="kb-info-item">
                            <span class="kb-info-label">Confidence:</span>
                            <span class="kb-info-value kb-confidence-${profileData.confidence}">${profileData.confidence || 'High'}</span>
                        </div>
                    </div>
                    
                    <div class="kb-description">
                        <p>This entity is part of our curated knowledge base, providing high-quality, pre-verified information that enhances classification accuracy and reduces external API dependencies.</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Export for use in other modules
window.ProfilePage = ProfilePage;
