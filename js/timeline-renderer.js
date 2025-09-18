/**
 * Timeline Renderer Module
 * Handles rendering of chronological timeline visualization
 */

class TimelineRenderer {
    constructor() {
        this.container = null;
        this.data = [];
        this.groupedData = {};
        this.actorPillRenderer = new ActorPillRenderer();
    }

    /**
     * Initialize the timeline renderer
     * @param {string} containerId - ID of the container element
     */
    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Timeline container not found:', containerId);
            return;
        }
        console.log('Timeline renderer initialized');
    }

    /**
     * Render timeline data
     * @param {Array<Object>} data - Array of data objects
     */
    async renderTimeline(data) {
        if (!this.container) {
            console.error('Timeline not initialized');
            return;
        }

        this.data = data;
        
        if (!data || data.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();
        
        // Initialize actor classifications
        await this.actorPillRenderer.initializeClassifications(data);
        
        this.processTimelineData(data);
        this.renderTimelineView();
    }

    /**
     * Process and group data by date
     * @param {Array<Object>} data - Raw data array
     */
    processTimelineData(data) {
        // Sort data by datetime
        const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.Datetimes || a['Date Received'] || 0);
            const dateB = new Date(b.Datetimes || b['Date Received'] || 0);
            
            // Handle invalid dates by putting them at the end
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            
            return dateA - dateB;
        });

        // Group by date (day level)
        this.groupedData = {};
        sortedData.forEach(record => {
            const datetime = record.Datetimes || record['Date Received'];
            if (!datetime) return;

            const date = new Date(datetime);
            // Check if date is valid before calling toISOString()
            if (isNaN(date.getTime())) {
                console.warn('Invalid date found in timeline data:', datetime, record);
                return;
            }
            
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            if (!this.groupedData[dateKey]) {
                this.groupedData[dateKey] = {
                    date: date,
                    dateString: dateKey,
                    records: []
                };
            }
            
            this.groupedData[dateKey].records.push(record);
        });
    }

    /**
     * Render the timeline view
     */
    renderTimelineView() {
        const timelineHTML = `
            <div class="timeline-header">
                <h2>Timeline View</h2>
                <p>Events organized chronologically (${Object.keys(this.groupedData).length} dates, ${this.data.length} events)</p>
            </div>
            <div class="timeline-content">
                ${this.renderTimelineEntries()}
            </div>
        `;

        this.container.innerHTML = timelineHTML;
    }

    /**
     * Render timeline entries
     * @returns {string} HTML for timeline entries
     */
    renderTimelineEntries() {
        const sortedDates = Object.keys(this.groupedData).sort();
        
        return sortedDates.map(dateKey => {
            const dayData = this.groupedData[dateKey];
            return this.renderTimelineDay(dayData);
        }).join('');
    }

    /**
     * Render a single day in the timeline
     * @param {Object} dayData - Data for a single day
     * @returns {string} HTML for the day
     */
    renderTimelineDay(dayData) {
        const formattedDate = this.formatDate(dayData.date);
        const recordsByTime = this.groupRecordsByTime(dayData.records);
        
        return `
            <div class="timeline-day">
                <div class="timeline-date">
                    <div class="timeline-date-marker"></div>
                    <div class="timeline-date-text">
                        <div class="timeline-date-main">${formattedDate.main}</div>
                        <div class="timeline-date-sub">${formattedDate.sub}</div>
                    </div>
                </div>
                <div class="timeline-events">
                    ${recordsByTime.map(timeGroup => this.renderTimeGroup(timeGroup)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Group records by time within a day
     * @param {Array<Object>} records - Records for a single day
     * @returns {Array<Object>} Time-grouped records
     */
    groupRecordsByTime(records) {
        const timeGroups = {};
        
        records.forEach(record => {
            const datetime = record.Datetimes || record['Date Received'];
            const date = new Date(datetime);
            // Check if date is valid before calling toTimeString()
            if (isNaN(date.getTime())) {
                console.warn('Invalid date found in timeline time grouping:', datetime, record);
                return;
            }
            const timeKey = date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
            
            if (!timeGroups[timeKey]) {
                timeGroups[timeKey] = {
                    time: timeKey,
                    records: []
                };
            }
            
            timeGroups[timeKey].records.push(record);
        });

        // Sort by time
        return Object.values(timeGroups).sort((a, b) => a.time.localeCompare(b.time));
    }

    /**
     * Render a time group within a day
     * @param {Object} timeGroup - Group of records at the same time
     * @returns {string} HTML for the time group
     */
    renderTimeGroup(timeGroup) {
        return `
            <div class="timeline-time-group">
                <div class="timeline-time">${timeGroup.time}</div>
                <div class="timeline-cards">
                    ${timeGroup.records.map(record => this.renderTimelineCard(record)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single timeline card
     * @param {Object} record - Data record
     * @returns {string} HTML for the timeline card
     */
    renderTimelineCard(record) {
        const actors = this.splitAndClean(record.Actor);
        const targets = this.splitAndClean(record.Target);
        const locations = this.splitAndClean(record.Locations);

        return `
            <div class="timeline-card">
                <div class="timeline-card-header">
                    <div class="timeline-card-sentence">${record.Sentence || 'No description available'}</div>
                </div>
                <div class="timeline-card-body">
                    <div class="timeline-card-details">
                        ${actors.length > 0 ? `
                            <div class="timeline-detail">
                                <span class="timeline-detail-label">Actors:</span>
                                <div class="timeline-detail-pills">
                                    ${this.actorPillRenderer.renderActorPills(actors, 'normal')}
                                </div>
                            </div>
                        ` : ''}
                        ${targets.length > 0 ? `
                            <div class="timeline-detail">
                                <span class="timeline-detail-label">Targets:</span>
                                <div class="timeline-detail-pills">
                                    ${this.actorPillRenderer.renderActorPills(targets, 'normal')}
                                </div>
                            </div>
                        ` : ''}
                        ${locations.length > 0 ? `
                            <div class="timeline-detail">
                                <span class="timeline-detail-label">Locations:</span>
                                <div class="timeline-detail-pills">
                                    ${locations.map(location => `<span class="timeline-pill location-pill">${location}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Split and clean entity names
     * @param {string} entityString - String containing entity names
     * @returns {Array<string>} Array of clean entity names
     */
    splitAndClean(entityString) {
        if (!entityString || typeof entityString !== 'string') {
            return [];
        }
        
        return entityString.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }

    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {Object} Formatted date parts
     */
    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const fullDate = date.toLocaleDateString('en-US', options);
        const [weekday, ...rest] = fullDate.split(', ');
        
        return {
            main: rest.join(', '),
            sub: weekday
        };
    }

    /**
     * Show no data message
     */
    showNoData() {
        const noDataDiv = this.container.querySelector('.no-data');
        if (noDataDiv) {
            noDataDiv.style.display = 'block';
        }
    }

    /**
     * Hide no data message
     */
    hideNoData() {
        const noDataDiv = this.container.querySelector('.no-data');
        if (noDataDiv) {
            noDataDiv.style.display = 'none';
        }
    }

    /**
     * Clear timeline content
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '<div class="no-data">Upload a CSV file to see the timeline</div>';
        }
        this.data = [];
        this.groupedData = {};
    }
}

// Export for use in other modules
window.TimelineRenderer = TimelineRenderer;
