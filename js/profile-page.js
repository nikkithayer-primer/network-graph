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
        
        return `
            <div class="profile-header">
                <button class="profile-close" aria-label="Close profile">×</button>
                <div class="profile-title-section">
                    <h2 class="profile-name">${profileData.id || profileData.name}</h2>
                    ${isPoliticalFigure ? `
                        <div class="profile-role">${profileData.role}</div>
                        <div class="profile-meta">
                            ${profileData.state ? `<span class="profile-state">📍 ${profileData.state}</span>` : ''}
                            ${this.getPartyBadge(profileData)}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="profile-content">
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
}

// Export for use in other modules
window.ProfilePage = ProfilePage;
