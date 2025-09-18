/**
 * Network Graph Renderer Module
 * Handles rendering of network graph visualization using D3.js
 */

class NetworkGraphRenderer {
    constructor() {
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.width = 800;
        this.height = 600;
        this.containerId = null;
        this.colorScale = null;
        this.profileHandler = null;
        this.politicalNodes = [];
        this.politicalLinks = [];
        this.zoom = null; // Store zoom behavior
        
        // Performance optimization: Track data changes
        this.lastDataHash = null;
        this.lastProcessedData = null;
        
        // Initialize color scale for different entity types
        this.initializeColorScale();
    }

    /**
     * Initialize color scale for different node types
     */
    initializeColorScale() {
        const colors = CSSUtils.getColorPalette();
        this.colorScale = d3.scaleOrdinal()
            .domain(['actor', 'target', 'both', 'political_figure', 'democratic', 'republican', 'independent'])
            .range([
                colors.network.actor,
                colors.network.target,
                colors.network.both,
                colors.network.political_figure,
                colors.network.democratic,
                colors.network.republican,
                colors.network.independent
            ]);
    }

    /**
     * Initialize the network graph container
     * @param {string} containerId - ID of the container element
     */
    initializeGraph(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('Network graph container not found:', containerId);
            return;
        }

        // Clear existing content
        container.innerHTML = '';
        
        // Get container dimensions
        const rect = container.getBoundingClientRect();
        this.width = rect.width || 800;
        this.height = rect.height || 600;
        
        // Create SVG element
        this.svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', CSSUtils.getCSSVariable('--bg-light'))
            .style('border-radius', '8px');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('.graph-container')
                    .attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Create main graph container
        this.svg.append('g')
            .attr('class', 'graph-container');

        // Add legend
        this.createLegend();
        
        // Add controls
        this.createControls();

        console.log('Network graph initialized');
    }

    /**
     * Set profile handler function
     * @param {Function} handler - Function to call when a node is clicked for profile
     */
    setProfileHandler(handler) {
        this.profileHandler = handler;
    }

    /**
     * Create legend for the network graph
     */
    createLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'network-legend')
            .attr('transform', `translate(20, 20)`);

        const legendData = [
            { type: 'actor', label: 'Actor', color: this.colorScale('actor') },
            { type: 'target', label: 'Target', color: this.colorScale('target') },
            { type: 'both', label: 'Actor & Target', color: this.colorScale('both') }
        ];

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('circle')
            .attr('r', 8)
            .attr('fill', d => d.color)
            .attr('stroke', CSSUtils.getCSSVariable('--bg-white'))
            .attr('stroke-width', 2);

        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', CSSUtils.getCSSVariable('--text-primary'))
            .style('font-weight', '500')
            .text(d => d.label);
    }

    /**
     * Create controls for the network graph
     */
    createControls() {
        const controls = this.svg.append('g')
            .attr('class', 'network-controls')
            .attr('transform', `translate(${this.width - 150}, 20)`);

        // Add background
        controls.append('rect')
            .attr('width', 130)
            .attr('height', 80)
            .attr('fill', CSSUtils.getCSSVariable('--bg-white'))
            .attr('stroke', CSSUtils.getCSSVariable('--border-light'))
            .attr('rx', 6);

        // Add title
        controls.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', CSSUtils.getCSSVariable('--text-primary'))
            .text('Controls');

        // Add reset zoom button
        const resetButton = controls.append('g')
            .attr('class', 'reset-button')
            .style('cursor', 'pointer');

        resetButton.append('rect')
            .attr('x', 10)
            .attr('y', 30)
            .attr('width', 110)
            .attr('height', 25)
            .attr('fill', CSSUtils.getCSSVariable('--action-blue'))
            .attr('rx', 4)
            .on('click', () => this.resetZoom());

        resetButton.append('text')
            .attr('x', 65)
            .attr('y', 47)
            .style('font-size', '11px')
            .style('fill', CSSUtils.getCSSVariable('--bg-white'))
            .style('text-anchor', 'middle')
            .style('font-weight', '500')
            .text('Reset Zoom')
            .on('click', () => this.resetZoom());

        // Add node count
        controls.append('text')
            .attr('class', 'node-count')
            .attr('x', 10)
            .attr('y', 70)
            .style('font-size', '10px')
            .style('fill', CSSUtils.getCSSVariable('--text-secondary'))
            .text('Nodes: 0');
    }

    /**
     * Reset zoom to fit all nodes
     */
    resetZoom() {
        if (!this.svg || !this.zoom) return;

        const transition = this.svg.transition().duration(750);
        this.svg.call(
            this.zoom.transform,
            d3.zoomIdentity.translate(0, 0).scale(1)
        );
    }

    /**
     * Generate a simple hash for data change detection
     * @param {Array<Object>} data - Array of data objects
     * @returns {string} Hash string
     */
    hashData(data) {
        if (!data || data.length === 0) return 'empty';
        
        // Create a simple hash based on data length and a sample of content
        const sample = data.slice(0, Math.min(5, data.length))
            .map(record => `${record.Actor}-${record.Target}-${record.Action}`)
            .join('|');
        
        return `${data.length}-${sample}`;
    }

    /**
     * Process data and create nodes and links
     * @param {Array<Object>} data - Array of data objects
     */
    processData(data) {
        if (!data || data.length === 0) {
            this.nodes = [];
            this.links = [];
            this.lastDataHash = 'empty';
            return;
        }

        // Check if data has changed to avoid unnecessary processing
        const currentHash = this.hashData(data);
        if (currentHash === this.lastDataHash && this.nodes.length > 0) {
            console.log('Network graph: Data unchanged, skipping processing');
            return;
        }

        console.log('Network graph: Processing data changes');
        this.lastDataHash = currentHash;
        this.lastProcessedData = data;

        const nodeMap = new Map();
        const linkMap = new Map();

        // Process each record to extract actors, targets, and their relationships
        data.forEach((record, recordIndex) => {
            if (!record.Actor || !record.Target) return;

            // Parse actors and targets (handle comma-separated values)
            const actors = record.Actor.split(',').map(a => a.trim()).filter(a => a.length > 0);
            const targets = record.Target.split(',').map(t => t.trim()).filter(t => t.length > 0);
            const action = record.Action || 'unknown';

            // Add actors as nodes
            actors.forEach(actor => {
                if (!nodeMap.has(actor)) {
                    // Determine node type based on record type
                    const nodeType = record._isPoliticalConnection ? 'political_figure' : 'actor';
                    nodeMap.set(actor, {
                        id: actor,
                        name: actor,
                        type: nodeType,
                        count: 0,
                        actions: new Set(),
                        records: [],
                        // Store political metadata if available
                        role: record._sourceRole,
                        isPoliticalFigure: record._isPoliticalConnection
                    });
                }
                const node = nodeMap.get(actor);
                node.count++;
                node.actions.add(action);
                node.records.push(record);
                
                // If this is a political connection and node wasn't already political, upgrade it
                if (record._isPoliticalConnection && node.type !== 'political_figure') {
                    node.type = 'both'; // Both political figure and CSV actor
                    node.role = record._sourceRole;
                    node.isPoliticalFigure = true;
                }
            });

            // Add targets as nodes
            targets.forEach(target => {
                if (!nodeMap.has(target)) {
                    // Determine node type based on record type
                    const nodeType = record._isPoliticalConnection ? 'political_figure' : 'target';
                    nodeMap.set(target, {
                        id: target,
                        name: target,
                        type: nodeType,
                        count: 0,
                        actions: new Set(),
                        records: [],
                        // Store political metadata if available
                        role: record._targetRole,
                        isPoliticalFigure: record._isPoliticalConnection
                    });
                } else {
                    // If already exists, update type appropriately
                    const node = nodeMap.get(target);
                    if (record._isPoliticalConnection && !node.isPoliticalFigure) {
                        node.type = node.type === 'actor' ? 'both' : 'political_figure';
                        node.role = record._targetRole;
                        node.isPoliticalFigure = true;
                    } else if (node.type === 'actor' && !record._isPoliticalConnection) {
                        node.type = 'both';
                    } else if (node.type === 'political_figure' && !record._isPoliticalConnection) {
                        node.type = 'both';
                    }
                }
                const node = nodeMap.get(target);
                node.count++;
                node.actions.add(action);
                node.records.push(record);
            });

            // Create links between actors and targets
            actors.forEach(actor => {
                targets.forEach(target => {
                    const linkId = `${actor}->${target}`;
                    if (!linkMap.has(linkId)) {
                        linkMap.set(linkId, {
                            source: actor,
                            target: target,
                            action: action,
                            count: 0,
                            actions: new Set(),
                            records: [],
                            // Add political metadata if this is a political connection
                            isPoliticalConnection: record._isPoliticalConnection,
                            relationship: record._relationship
                        });
                    }
                    const link = linkMap.get(linkId);
                    link.count++;
                    link.actions.add(action);
                    link.records.push(record);
                });
            });
        });

        // Convert maps to arrays
        this.nodes = Array.from(nodeMap.values());
        this.links = Array.from(linkMap.values());

        // Calculate node sizes based on connection count
        const maxCount = Math.max(...this.nodes.map(n => n.count));
        this.nodes.forEach(node => {
            node.radius = Math.max(8, Math.min(25, (node.count / maxCount) * 20 + 8));
        });

        console.log(`Processed ${this.nodes.length} nodes and ${this.links.length} links`);
    }

    /**
     * Render political network data from JSON
     * @param {Object} networkData - Network data with nodes and links arrays
     */
    async renderPoliticalNetwork(networkData) {
        if (!this.svg) {
            console.error('Network graph not initialized. Call initializeGraph first.');
            return;
        }

        // Store political data
        this.politicalNodes = networkData.nodes || [];
        this.politicalLinks = networkData.links || [];
        
        // Debug: Check for invalid links
        console.log(`Received network data: ${this.politicalNodes.length} nodes, ${this.politicalLinks.length} links`);
        const invalidLinks = this.politicalLinks.filter(link => {
            const sourceExists = this.politicalNodes.some(node => node.id === link.source);
            const targetExists = this.politicalNodes.some(node => node.id === link.target);
            return !sourceExists || !targetExists;
        });
        
        if (invalidLinks.length > 0) {
            console.warn(`Found ${invalidLinks.length} invalid links:`, invalidLinks);
            // Filter out invalid links to prevent D3 errors
            this.politicalLinks = this.politicalLinks.filter(link => {
                const sourceExists = this.politicalNodes.some(node => node.id === link.source);
                const targetExists = this.politicalNodes.some(node => node.id === link.target);
                if (!sourceExists || !targetExists) {
                    console.warn(`Removing invalid link: ${link.source} -> ${link.target}`);
                    return false;
                }
                return true;
            });
        }

        // Set as current data
        this.nodes = [...this.politicalNodes];
        this.links = [...this.politicalLinks];

        if (this.nodes.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();
        await this.renderNetworkVisualization();
    }

    /**
     * Render the network graph
     * @param {Array<Object>} data - Array of data objects
     */
    async renderNetwork(data) {
        if (!this.svg) {
            console.error('Network graph not initialized. Call initializeGraph first.');
            return;
        }

        // Process all data (now includes both political and CSV data)
        this.processData(data);

        // No need to merge separately since data already contains everything
        // The processData method will handle both political connections and CSV data

        if (this.nodes.length === 0) {
            this.showNoData();
            return;
        }

        this.hideNoData();
        await this.renderNetworkVisualization();
    }

    /**
     * Merge CSV data with existing political data
     */
    mergeWithPoliticalData() {
        if (this.politicalNodes.length === 0) return;

        const nodeMap = new Map();
        const linkMap = new Map();

        // Add political nodes first
        this.politicalNodes.forEach(node => {
            nodeMap.set(node.id, { ...node });
        });

        // Add political links
        this.politicalLinks.forEach(link => {
            const linkId = `${link.source}->${link.target}`;
            linkMap.set(linkId, { ...link });
        });

        // Add CSV nodes, merging with existing political figures
        this.nodes.forEach(csvNode => {
            if (nodeMap.has(csvNode.id)) {
                // Merge with existing political figure
                const politicalNode = nodeMap.get(csvNode.id);
                politicalNode.count += csvNode.count;
                politicalNode.records = [...(politicalNode.records || []), ...csvNode.records];
                csvNode.actions.forEach(action => politicalNode.actions.add(action));
                // Keep political figure styling but add CSV data
                politicalNode.type = 'both'; // Both political figure and CSV actor
            } else {
                // Add new CSV node
                nodeMap.set(csvNode.id, csvNode);
            }
        });

        // Add CSV links
        this.links.forEach(csvLink => {
            const linkId = `${csvLink.source}->${csvLink.target}`;
            if (linkMap.has(linkId)) {
                // Merge with existing political connection
                const politicalLink = linkMap.get(linkId);
                politicalLink.count += csvLink.count;
                politicalLink.records = [...(politicalLink.records || []), ...csvLink.records];
                csvLink.actions.forEach(action => politicalLink.actions.add(action));
            } else {
                // Add new CSV link
                linkMap.set(linkId, csvLink);
            }
        });

        // Update current nodes and links
        this.nodes = Array.from(nodeMap.values());
        this.links = Array.from(linkMap.values());

        // Recalculate node sizes
        const maxCount = Math.max(...this.nodes.map(n => n.count));
        this.nodes.forEach(node => {
            if (!node.radius || node.type === 'political_figure') {
                node.radius = Math.max(12, Math.min(30, (node.count / maxCount) * 25 + 12));
            }
        });
    }

    /**
     * Render the network visualization
     */
    async renderNetworkVisualization() {
        // Clear existing graph
        this.svg.select('.graph-container').selectAll('*').remove();

        const graphContainer = this.svg.select('.graph-container');

        // Create or update force simulation
        if (this.simulation) {
            // Update existing simulation with new data
            console.log('Network graph: Updating existing simulation');
            this.simulation.nodes(this.nodes);
            this.simulation.force('link').links(this.links);
            this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
            this.simulation.alpha(0.3).restart();
        } else {
            // Create new simulation
            console.log('Network graph: Creating new simulation');
            this.simulation = d3.forceSimulation(this.nodes)
                .force('link', d3.forceLink(this.links)
                    .id(d => d.id)
                    .distance(d => Math.max(50, 100 - (d.count * 2)))
                    .strength(0.5))
                .force('charge', d3.forceManyBody()
                    .strength(d => -300 - (d.radius * 10)))
                .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                .force('collision', d3.forceCollide()
                    .radius(d => d.radius + 5));
        }

        // Create links
        const link = graphContainer.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.links)
            .enter()
            .append('line')
            .attr('stroke', CSSUtils.getCSSVariable('--border-dark'))
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', d => Math.max(1, Math.min(5, d.count)))
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.showRelationshipPopover(event, d))
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke', CSSUtils.getCSSVariable('--action-blue'))
                    .attr('stroke-opacity', 0.8);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke', CSSUtils.getCSSVariable('--border-dark'))
                    .attr('stroke-opacity', 0.6);
            });

        // Link labels removed - actions will be shown in popover instead

        // Create nodes
        const node = graphContainer.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(this.nodes)
            .enter()
            .append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => this.colorScale(d.type))
            .attr('stroke', CSSUtils.getCSSVariable('--bg-white'))
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(this.createDragBehavior());

        // Create node labels
        const nodeLabel = graphContainer.append('g')
            .attr('class', 'node-labels')
            .selectAll('text')
            .data(this.nodes)
            .enter()
            .append('text')
            .style('font-size', '11px')
            .style('font-weight', '500')
            .style('fill', CSSUtils.getCSSVariable('--text-primary'))
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name);

        // Add click handlers for profiles and sentences
        this.addNodeClickHandlers(node);

        // Update node count in controls
        this.svg.select('.node-count')
            .text(`Nodes: ${this.nodes.length}`);

        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            nodeLabel
                .attr('x', d => d.x)
                .attr('y', d => d.y + d.radius + 15);
        });
    }

    /**
     * Create drag behavior for nodes
     */
    createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    /**
     * Add click handlers to nodes for profiles and sentences
     * @param {d3.Selection} nodeSelection - D3 selection of nodes
     */
    addNodeClickHandlers(nodeSelection) {
        // Create popover container (hidden by default)
        let popover = d3.select('body').select('.network-popover');
        if (popover.empty()) {
            popover = d3.select('body')
                .append('div')
                .attr('class', 'network-popover')
                .style('position', 'absolute')
                .style('visibility', 'hidden')
                .style('background-color', CSSUtils.getCSSVariable('--bg-white'))
                .style('border', `1px solid ${CSSUtils.getCSSVariable('--border-light')}`)
                .style('border-radius', '8px')
                .style('padding', '16px')
                .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.15)')
                .style('font-size', '14px')
                .style('max-width', '400px')
                .style('max-height', '300px')
                .style('overflow-y', 'auto')
                .style('z-index', '1001');

            // Add close button
            popover.append('div')
                .attr('class', 'popover-close')
                .style('position', 'absolute')
                .style('top', '8px')
                .style('right', '12px')
                .style('cursor', 'pointer')
                .style('font-size', '18px')
                .style('color', CSSUtils.getCSSVariable('--text-secondary'))
                .style('font-weight', 'bold')
                .text('×')
                .on('click', () => {
                    popover.style('visibility', 'hidden');
                });
        }

        // Add click handlers to nodes
        nodeSelection
            .on('click', (event, d) => {
                event.stopPropagation();
                
                console.log('Node clicked:', d.name, {
                    type: d.type,
                    isPoliticalFigure: d.isPoliticalFigure,
                    politicalData: d.politicalData,
                    role: d.role,
                    recordCount: d.records ? d.records.length : 0
                });
                
                // Determine if this should use profile handler or popover
                // Use profile handler only for nodes that have actual political data
                const hasActualPoliticalData = d.isPoliticalFigure && 
                    (d.politicalData || d.type === 'political_figure' || 
                     (d.type === 'both' && d.role)); // 'both' nodes with political roles
                
                console.log('hasActualPoliticalData:', hasActualPoliticalData, 'profileHandler exists:', !!this.profileHandler);
                
                if (this.profileHandler && hasActualPoliticalData) {
                    console.log('Using profile handler for:', d.name);
                    // Use profile handler for political figures with actual political data
                    this.profileHandler(d, d.records || []);
                } else {
                    console.log('Using popover for:', d.name);
                    // Show sentence popover for CSV entities and non-political nodes
                    this.showSentencePopover(event, d, popover);
                }
            });

        // Close popover when clicking outside
        d3.select('body').on('click.popover', () => {
            popover.style('visibility', 'hidden');
        });
    }

    /**
     * Show sentence popover for non-political entities
     * @param {Event} event - Click event
     * @param {Object} nodeData - Node data
     * @param {d3.Selection} popover - Popover element
     */
    showSentencePopover(event, nodeData, popover) {
        console.log('Showing popover for:', nodeData.name, 'Type:', nodeData.type, 'isPoliticalFigure:', nodeData.isPoliticalFigure);
        
        // Get sentences for this actor
        const sentences = this.getSentencesForActor(nodeData.name);
        
        if (sentences.length === 0) {
            const popoverContent = `
                <div style="font-weight: 600; margin-bottom: 12px; padding-right: 20px;">${nodeData.name}</div>
                <div style="color: ${CSSUtils.getCSSVariable('--text-secondary')}; font-style: italic;">No sentences found for this actor.</div>
            `;
            popover.html(popoverContent);
        } else {
            const popoverContent = `
                <div style="font-weight: 600; margin-bottom: 12px; padding-right: 20px;">${nodeData.name}</div>
                <div style="font-size: 12px; color: ${CSSUtils.getCSSVariable('--text-secondary')}; margin-bottom: 12px;">
                    ${sentences.length} sentence${sentences.length !== 1 ? 's' : ''} found
                </div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${sentences.map((sentence, index) => `
                        <div style="margin-bottom: 12px; padding: 8px; background-color: ${CSSUtils.getCSSVariable('--bg-light')}; border-radius: 4px; border-left: 3px solid ${CSSUtils.getCSSVariable('--action-blue')};">
                            <div style="font-size: 13px; line-height: 1.4;">${sentence}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="popover-close" style="position: absolute; top: 8px; right: 12px; cursor: pointer; font-size: 18px; color: ${CSSUtils.getCSSVariable('--text-secondary')}; font-weight: bold;">×</div>
            `;
            popover.html(popoverContent);
            
            // Re-add close button handler (since we replaced the HTML)
            popover.select('.popover-close')
                .on('click', () => {
                    popover.style('visibility', 'hidden');
                });
        }
        
        // Position popover near the click location using smart positioning
        PopoverUtils.positionEventPopover(popover, event);
    }

    /**
     * Get sentences related to a specific actor
     * @param {string} actorName - Name of the actor
     * @returns {Array<string>} Array of sentences
     */
    getSentencesForActor(actorName) {
        const sentences = [];
        
        // Look through all nodes to find records for this actor
        const actorNode = this.nodes.find(node => node.name === actorName);
        if (actorNode && actorNode.records) {
            actorNode.records.forEach(record => {
                if (record.Sentence && record.Sentence.trim()) {
                    sentences.push(record.Sentence.trim());
                }
            });
        }
        
        // Remove duplicates
        return [...new Set(sentences)];
    }

    /**
     * Show relationship popover when a link is clicked
     * @param {Event} event - Click event
     * @param {Object} linkData - Link data object
     */
    showRelationshipPopover(event, linkData) {
        event.stopPropagation();
        
        // Create or get existing popover
        let popover = d3.select('body').select('.network-relationship-popover');
        if (popover.empty()) {
            popover = d3.select('body')
                .append('div')
                .attr('class', 'network-relationship-popover')
                .style('position', 'absolute')
                .style('visibility', 'hidden')
                .style('background-color', CSSUtils.getCSSVariable('--bg-white'))
                .style('border', `1px solid ${CSSUtils.getCSSVariable('--border-light')}`)
                .style('border-radius', '8px')
                .style('padding', '16px')
                .style('box-shadow', '0 10px 25px rgba(0, 0, 0, 0.15)')
                .style('font-size', '14px')
                .style('max-width', '450px')
                .style('max-height', '400px')
                .style('overflow-y', 'auto')
                .style('z-index', '1002');
        }

        // Get relationship details
        const sourceActor = linkData.source.name || linkData.source;
        const targetActor = linkData.target.name || linkData.target;
        const actions = Array.from(linkData.actions);
        const records = linkData.records || [];

        // Create popover content
        const popoverContent = `
            <div style="font-weight: 600; margin-bottom: 12px; padding-right: 20px;">
                Relationship: ${sourceActor} → ${targetActor}
            </div>
            <div style="font-size: 12px; color: ${CSSUtils.getCSSVariable('--text-secondary')}; margin-bottom: 12px;">
                ${records.length} interaction${records.length !== 1 ? 's' : ''} found
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-weight: 500; margin-bottom: 8px; color: ${CSSUtils.getCSSVariable('--text-primary')};">Actions:</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${actions.map(action => `
                        <span style="background: ${CSSUtils.getCSSVariable('--action-blue-light')}; color: ${CSSUtils.getCSSVariable('--action-blue-hover')}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                            ${action}
                        </span>
                    `).join('')}
                </div>
            </div>
            <div style="max-height: 250px; overflow-y: auto;">
                <div style="font-weight: 500; margin-bottom: 8px; color: ${CSSUtils.getCSSVariable('--text-primary')};">Details:</div>
                ${records.map((record, index) => `
                    <div style="margin-bottom: 12px; padding: 12px; background-color: ${CSSUtils.getCSSVariable('--bg-light')}; border-radius: 6px; border-left: 3px solid ${CSSUtils.getCSSVariable('--action-blue')};">
                        <div style="font-size: 13px; line-height: 1.4; margin-bottom: 8px;">
                            <strong>${record.Action || 'Unknown Action'}:</strong> ${record.Sentence || 'No description available'}
                        </div>
                        ${record['Date Received'] || record.Datetimes ? `
                            <div style="font-size: 11px; color: ${CSSUtils.getCSSVariable('--text-secondary')};">
                                📅 ${record['Date Received'] || record.Datetimes}
                            </div>
                        ` : ''}
                        ${record.Locations ? `
                            <div style="font-size: 11px; color: ${CSSUtils.getCSSVariable('--text-secondary')};">
                                📍 ${record.Locations}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="popover-close" style="position: absolute; top: 8px; right: 12px; cursor: pointer; font-size: 18px; color: ${CSSUtils.getCSSVariable('--text-secondary')}; font-weight: bold;">×</div>
        `;

        popover.html(popoverContent);
        
        // Add close button handler
        popover.select('.popover-close')
            .on('click', () => {
                popover.style('visibility', 'hidden');
            });

        // Position popover near the click location using smart positioning
        PopoverUtils.positionEventPopover(popover, event);

        // Close popover when clicking outside (but not immediately)
        setTimeout(() => {
            d3.select('body').on('click.relationship-popover', (e) => {
                if (!popover.node().contains(e.target)) {
                    popover.style('visibility', 'hidden');
                }
            });
        }, 100);
    }

    /**
     * Show no data message
     */
    showNoData() {
        const container = document.getElementById(this.containerId);
        if (container) {
            const noDataDiv = container.querySelector('.no-data');
            if (noDataDiv) {
                noDataDiv.style.display = 'block';
            }
        }
        
        if (this.svg) {
            this.svg.select('.graph-container').selectAll('*').remove();
        }
    }

    /**
     * Hide no data message
     */
    hideNoData() {
        const container = document.getElementById(this.containerId);
        if (container) {
            const noDataDiv = container.querySelector('.no-data');
            if (noDataDiv) {
                noDataDiv.style.display = 'none';
            }
        }
    }

    /**
     * Resize the network graph
     */
    resizeGraph() {
        if (!this.svg || !this.containerId) return;

        const container = document.getElementById(this.containerId);
        const rect = container.getBoundingClientRect();
        const newWidth = rect.width || 800;
        const newHeight = rect.height || 600;

        if (newWidth !== this.width || newHeight !== this.height) {
            this.width = newWidth;
            this.height = newHeight;

            this.svg
                .attr('width', this.width)
                .attr('height', this.height);

            // Update force center
            if (this.simulation) {
                this.simulation
                    .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                    .alpha(0.3)
                    .restart();
            }

            // Update controls position
            this.svg.select('.network-controls')
                .attr('transform', `translate(${this.width - 150}, 20)`);
        }
    }

    /**
     * Clear the network graph
     */
    clear() {
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null; // Clear reference for garbage collection
        }
        
        if (this.svg) {
            // Remove event listeners before clearing DOM
            this.svg.selectAll('.node').on('click', null);
            this.svg.selectAll('.links line').on('click', null);
            this.svg.selectAll('*').remove();
        }
        
        this.nodes = [];
        this.links = [];
        
        // Clear performance tracking data
        this.lastDataHash = null;
        this.lastProcessedData = null;
        
        // Remove any popovers
        d3.selectAll('.network-popover').remove();
        d3.selectAll('.network-relationship-popover').remove();
        
        console.log('Network graph: Cleared and cleaned up');
    }
}

// Export for use in other modules
window.NetworkGraphRenderer = NetworkGraphRenderer;
