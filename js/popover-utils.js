/**
 * Popover Positioning Utilities
 * Provides smart positioning for popovers to keep them within viewport bounds
 */
class PopoverUtils {
    /**
     * Calculate optimal popover position
     * @param {Object} options - Positioning options
     * @param {number} options.targetX - Target X coordinate (relative to viewport)
     * @param {number} options.targetY - Target Y coordinate (relative to viewport)
     * @param {number} options.popoverWidth - Popover width
     * @param {number} options.popoverHeight - Popover height
     * @param {number} options.offsetX - X offset from target (default: 20)
     * @param {number} options.offsetY - Y offset from target (default: -50)
     * @param {number} options.margin - Minimum margin from viewport edges (default: 10)
     * @returns {Object} Calculated position with x, y coordinates
     */
    static calculatePosition(options) {
        const {
            targetX,
            targetY,
            popoverWidth,
            popoverHeight,
            offsetX = 20,
            offsetY = -50,
            margin = 10
        } = options;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Initial position
        let x = targetX + offsetX;
        let y = targetY + offsetY;

        // Adjust horizontal position if popover would go off screen
        if (x + popoverWidth > viewportWidth - margin) {
            // Try positioning to the left of the target
            x = targetX - popoverWidth - Math.abs(offsetX);
            
            // If still off screen, clamp to viewport
            if (x < margin) {
                x = viewportWidth - popoverWidth - margin;
            }
        }

        // Ensure minimum left margin
        x = Math.max(margin, x);

        // Adjust vertical position if popover would go off screen
        if (y + popoverHeight > viewportHeight - margin) {
            // Try positioning above the target
            y = targetY - popoverHeight - Math.abs(offsetY);
            
            // If still off screen, clamp to viewport
            if (y < margin) {
                y = viewportHeight - popoverHeight - margin;
            }
        }

        // Ensure minimum top margin
        y = Math.max(margin, y);

        return { x, y };
    }

    /**
     * Position a D3 selection popover element
     * @param {d3.Selection} popover - D3 selection of the popover element
     * @param {Object} options - Positioning options (same as calculatePosition)
     * @returns {Object} Applied position coordinates
     */
    static positionPopover(popover, options) {
        // Get popover dimensions
        const popoverNode = popover.node();
        
        // Make popover temporarily visible to measure dimensions
        const originalVisibility = popover.style('visibility');
        popover.style('visibility', 'hidden').style('display', 'block');
        
        const rect = popoverNode.getBoundingClientRect();
        const popoverWidth = rect.width || options.estimatedWidth || 400;
        const popoverHeight = rect.height || options.estimatedHeight || 200;
        
        // Calculate optimal position
        const position = this.calculatePosition({
            ...options,
            popoverWidth,
            popoverHeight
        });

        // Apply position
        popover
            .style('left', position.x + 'px')
            .style('top', position.y + 'px')
            .style('display', '')
            .style('visibility', 'visible');

        return position;
    }

    /**
     * Position popover relative to a node in a container
     * @param {d3.Selection} popover - D3 selection of the popover element
     * @param {Object} nodeData - Node data with x, y coordinates
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Additional positioning options
     * @returns {Object} Applied position coordinates
     */
    static positionNodePopover(popover, nodeData, containerId, options = {}) {
        const containerRect = document.getElementById(containerId).getBoundingClientRect();
        const targetX = containerRect.left + nodeData.x;
        const targetY = containerRect.top + nodeData.y;

        return this.positionPopover(popover, {
            targetX,
            targetY,
            offsetX: 20,
            offsetY: -50,
            ...options
        });
    }

    /**
     * Position popover relative to a mouse event
     * @param {d3.Selection} popover - D3 selection of the popover element
     * @param {Event} event - Mouse event with pageX, pageY coordinates
     * @param {Object} options - Additional positioning options
     * @returns {Object} Applied position coordinates
     */
    static positionEventPopover(popover, event, options = {}) {
        return this.positionPopover(popover, {
            targetX: event.pageX,
            targetY: event.pageY,
            offsetX: 10,
            offsetY: -50,
            ...options
        });
    }

    /**
     * Create a popover with automatic positioning
     * @param {string} className - CSS class name for the popover
     * @param {string} content - HTML content for the popover
     * @param {Object} positionOptions - Positioning options
     * @returns {d3.Selection} Created popover element
     */
    static createPositionedPopover(className, content, positionOptions) {
        // Remove any existing popover of the same class
        d3.selectAll(`.${className}`).remove();

        // Create new popover
        const popover = d3.select('body')
            .append('div')
            .attr('class', className)
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .html(content);

        // Position the popover
        this.positionPopover(popover, positionOptions);

        return popover;
    }

    /**
     * Add close button functionality to a popover
     * @param {d3.Selection} popover - D3 selection of the popover element
     * @param {string} closeButtonSelector - CSS selector for close button (default: '.popover-close')
     */
    static addCloseButton(popover, closeButtonSelector = '.popover-close') {
        popover.select(closeButtonSelector)
            .on('click', () => {
                popover.style('visibility', 'hidden');
            });

        // Close when clicking outside
        setTimeout(() => {
            d3.select('body').on(`click.${popover.attr('class')}`, (event) => {
                if (!popover.node().contains(event.target)) {
                    popover.style('visibility', 'hidden');
                }
            });
        }, 100);
    }
}

// Export for use in other modules
window.PopoverUtils = PopoverUtils;
