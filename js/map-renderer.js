/**
 * Map Renderer Module
 * Handles map visualization using Leaflet.js
 */

class MapRenderer {
    constructor() {
        this.map = null;
        this.markers = [];
        this.locationCache = new Map();
        this.colors = [
            '#2563eb', '#dc2626', '#059669', '#d97706', 
            '#7c3aed', '#db2777', '#0891b2', '#65a30d'
        ];
    }

    /**
     * Initialize the map
     * @param {string} containerId - ID of the map container
     */
    async initializeMap(containerId = 'mapContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear existing map if any
        if (this.map) {
            this.map.remove();
        }

        // Clear no-data message
        const noData = container.querySelector('.no-data');
        if (noData) {
            noData.style.display = 'none';
        }

        // Create map container div if it doesn't exist
        let mapDiv = container.querySelector('#map');
        if (!mapDiv) {
            mapDiv = document.createElement('div');
            mapDiv.id = 'map';
            mapDiv.style.height = '100%';
            mapDiv.style.width = '100%';
            container.appendChild(mapDiv);
        }

        // Initialize Leaflet map
        this.map = L.map('map').setView([39.8283, -98.5795], 4); // Center on USA

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        console.log('Map initialized successfully');
    }

    /**
     * Render data points on the map
     * @param {Array<Object>} data - Array of data objects
     */
    async renderData(data) {
        if (!this.map || !data || data.length === 0) {
            this.showNoData();
            return;
        }

        // Clear existing markers
        this.clearMarkers();

        // Group data by location
        const locationGroups = this.groupByLocation(data);
        const locations = Object.keys(locationGroups);

        console.log(`Rendering ${locations.length} locations on map`);

        // Get coordinates for all locations
        const locationCoords = await this.getLocationCoordinates(locations);

        // Create markers for each location
        let validMarkers = 0;
        Object.entries(locationGroups).forEach(([location, items], index) => {
            const coords = locationCoords.get(location);
            if (coords) {
                this.createMarker(coords, location, items, index);
                validMarkers++;
            }
        });

        if (validMarkers > 0) {
            // Fit map to show all markers
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        } else {
            this.showNoData('No valid locations found for mapping');
        }

        console.log(`Successfully placed ${validMarkers} markers on map`);
    }

    /**
     * Group data by location
     * @param {Array<Object>} data - Data array
     * @returns {Object} Grouped data by location
     */
    groupByLocation(data) {
        const groups = {};
        data.forEach(row => {
            const locations = row.Locations ? 
                row.Locations.split(',').map(l => l.trim()) : 
                ['Unknown'];
            
            locations.forEach(location => {
                if (location && location !== 'Unknown') {
                    if (!groups[location]) groups[location] = [];
                    groups[location].push(row);
                }
            });
        });
        return groups;
    }

    /**
     * Get coordinates for locations using a geocoding service
     * @param {Array<string>} locations - Array of location names
     * @returns {Map} Map of location to coordinates
     */
    async getLocationCoordinates(locations) {
        const coords = new Map();
        
        for (const location of locations) {
            // Check cache first
            if (this.locationCache.has(location)) {
                coords.set(location, this.locationCache.get(location));
                continue;
            }

            try {
                // Use Nominatim (OpenStreetMap) geocoding service
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
                );
                
                if (response.ok) {
                    const results = await response.json();
                    if (results.length > 0) {
                        const coord = {
                            lat: parseFloat(results[0].lat),
                            lng: parseFloat(results[0].lon)
                        };
                        coords.set(location, coord);
                        this.locationCache.set(location, coord);
                    }
                }
                
                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`Failed to geocode location: ${location}`, error);
            }
        }

        return coords;
    }

    /**
     * Create a marker for a location
     * @param {Object} coords - Coordinates {lat, lng}
     * @param {string} location - Location name
     * @param {Array<Object>} items - Data items for this location
     * @param {number} colorIndex - Index for color selection
     */
    createMarker(coords, location, items, colorIndex) {
        const color = this.colors[colorIndex % this.colors.length];
        
        // Create custom marker
        const marker = L.circleMarker([coords.lat, coords.lng], {
            radius: Math.min(8 + Math.log(items.length) * 2, 15),
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        // Create popup content
        const popupContent = this.createPopupContent(location, items);
        marker.bindPopup(popupContent, { maxWidth: 300 });

        // Add to map and store reference
        marker.addTo(this.map);
        this.markers.push(marker);
    }

    /**
     * Create popup content for a location
     * @param {string} location - Location name
     * @param {Array<Object>} items - Data items for this location
     * @returns {string} HTML content for popup
     */
    createPopupContent(location, items) {
        const uniqueActors = new Set(items.map(item => item.Actor).filter(a => a)).size;
        const uniqueTargets = new Set(items.map(item => item.Target).filter(t => t)).size;
        
        let content = `
            <div class="map-popup">
                <h4>${location}</h4>
                <div class="popup-field">
                    <span class="popup-label">Records:</span>
                    <span class="popup-value">${items.length}</span>
                </div>
                <div class="popup-field">
                    <span class="popup-label">Actors:</span>
                    <span class="popup-value">${uniqueActors}</span>
                </div>
                <div class="popup-field">
                    <span class="popup-label">Targets:</span>
                    <span class="popup-value">${uniqueTargets}</span>
                </div>
        `;

        // Show recent activities (max 3) with actor pills
        if (items.length > 0) {
            content += '<hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-light);">';
            content += '<div style="font-weight: 500; margin-bottom: 6px;">Recent Activities:</div>';
            
            items.slice(0, 3).forEach(item => {
                // Get actor pill renderer if available
                const actorPillRenderer = window.ViewRenderers?.actorPillRenderer;
                
                const actorDisplay = actorPillRenderer && item.Actor ? 
                    actorPillRenderer.renderActorPillsFromString(item.Actor, 'popup') : 
                    (item.Actor || 'Unknown');
                
                const targetDisplay = actorPillRenderer && item.Target ? 
                    actorPillRenderer.renderActorPillsFromString(item.Target, 'popup') : 
                    (item.Target || 'Unknown');
                
                content += `
                    <div style="margin-bottom: 6px; font-size: 0.8125rem;">
                        <div style="margin-bottom: 2px;">
                            ${actorDisplay} → ${targetDisplay}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.75rem;">
                            ${item.Action ? `${item.Action}` : 'Unknown Action'}
                        </div>
                    </div>
                `;
            });
            
            if (items.length > 3) {
                content += `<div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">...and ${items.length - 3} more</div>`;
            }
        }

        content += '</div>';
        return content;
    }

    /**
     * Clear all markers from the map
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    /**
     * Show no data message
     * @param {string} message - Custom message to display
     */
    showNoData(message = 'Upload a CSV file to see locations on the map') {
        const container = document.getElementById('mapContainer');
        if (!container) return;

        // Hide map if it exists
        const mapDiv = container.querySelector('#map');
        if (mapDiv) {
            mapDiv.style.display = 'none';
        }

        // Show no-data message
        let noData = container.querySelector('.no-data');
        if (!noData) {
            noData = document.createElement('div');
            noData.className = 'no-data';
            container.appendChild(noData);
        }
        
        noData.textContent = message;
        noData.style.display = 'block';
    }

    /**
     * Hide no data message and show map
     */
    hideNoData() {
        const container = document.getElementById('mapContainer');
        if (!container) return;

        const noData = container.querySelector('.no-data');
        if (noData) {
            noData.style.display = 'none';
        }

        const mapDiv = container.querySelector('#map');
        if (mapDiv) {
            mapDiv.style.display = 'block';
        }
    }

    /**
     * Resize map to fit container
     */
    resizeMap() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Destroy the map instance
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
    }
}

// Export for use in other modules
window.MapRenderer = MapRenderer;
