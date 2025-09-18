/**
 * CSS Utilities for accessing CSS custom properties from JavaScript
 */
class CSSUtils {
    /**
     * Get the value of a CSS custom property
     * @param {string} property - CSS custom property name (e.g., '--action-blue')
     * @returns {string} The computed value of the CSS property
     */
    static getCSSVariable(property) {
        return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    }

    /**
     * Get color palette for charts and visualizations
     * @returns {Object} Object containing color arrays for different use cases
     */
    static getColorPalette() {
        return {
            // Primary colors for different entity types
            primary: [
                this.getCSSVariable('--action-blue'),
                this.getCSSVariable('--status-red'),
                this.getCSSVariable('--status-purple'),
                this.getCSSVariable('--status-green-accent'),
                this.getCSSVariable('--action-blue-hover'),
                this.getCSSVariable('--status-yellow-accent'),
                this.getCSSVariable('--text-secondary')
            ],
            
            // Network graph specific colors
            network: {
                actor: this.getCSSVariable('--action-blue'),
                target: this.getCSSVariable('--status-red'),
                both: this.getCSSVariable('--status-purple'),
                political_figure: this.getCSSVariable('--status-green-accent'),
                democratic: this.getCSSVariable('--action-blue-hover'),
                republican: this.getCSSVariable('--status-red'),
                independent: this.getCSSVariable('--text-secondary')
            },
            
            // Map marker colors
            map: [
                this.getCSSVariable('--action-blue'),
                this.getCSSVariable('--status-red'),
                this.getCSSVariable('--status-green-accent'),
                this.getCSSVariable('--status-yellow-accent'),
                this.getCSSVariable('--status-purple'),
                this.getCSSVariable('--status-red-border'),
                this.getCSSVariable('--pill-blue-text'),
                this.getCSSVariable('--status-green')
            ],
            
            // Background colors
            backgrounds: {
                light: this.getCSSVariable('--bg-light'),
                white: this.getCSSVariable('--bg-white'),
                medium: this.getCSSVariable('--bg-medium')
            },
            
            // Text colors
            text: {
                primary: this.getCSSVariable('--text-primary'),
                secondary: this.getCSSVariable('--text-secondary'),
                white: this.getCSSVariable('--text-white')
            },
            
            // Border colors
            borders: {
                light: this.getCSSVariable('--border-light'),
                medium: this.getCSSVariable('--border-medium'),
                dark: this.getCSSVariable('--border-dark')
            }
        };
    }
}

// Export for use in other modules
window.CSSUtils = CSSUtils;
