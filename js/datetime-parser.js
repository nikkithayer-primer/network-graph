/**
 * Natural Language DateTime Parser
 * Handles parsing of natural language date expressions and converts them to actual dates
 */
class DateTimeParser {
    constructor() {
        // Current date for relative calculations
        this.now = new Date();
        
        // Day name mappings
        this.dayNames = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2, 'tues': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
        };
        
        // Month name mappings
        this.monthNames = {
            'january': 0, 'jan': 0,
            'february': 1, 'feb': 1,
            'march': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'may': 4,
            'june': 5, 'jun': 5,
            'july': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sep': 8, 'sept': 8,
            'october': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'december': 11, 'dec': 11
        };
    }

    /**
     * Parse a datetime string that might contain natural language
     * @param {string} dateTimeStr - The datetime string to parse
     * @returns {Date|null} Parsed date or null if unparseable
     */
    parse(dateTimeStr) {
        if (!dateTimeStr || typeof dateTimeStr !== 'string') {
            return null;
        }

        const cleanStr = dateTimeStr.trim().toLowerCase();
        
        // Try standard date parsing first
        const standardDate = this.tryStandardParsing(dateTimeStr);
        if (standardDate) {
            return standardDate;
        }

        // Try natural language parsing
        return this.parseNaturalLanguage(cleanStr);
    }

    /**
     * Try standard JavaScript date parsing
     * @param {string} dateStr - Date string
     * @returns {Date|null} Parsed date or null
     */
    tryStandardParsing(dateStr) {
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (error) {
            // Continue to natural language parsing
        }
        return null;
    }

    /**
     * Parse natural language date expressions
     * @param {string} cleanStr - Cleaned lowercase date string
     * @returns {Date|null} Parsed date or null
     */
    parseNaturalLanguage(cleanStr) {
        // Handle relative day expressions
        if (cleanStr === 'today') {
            return new Date(this.now);
        }
        
        if (cleanStr === 'yesterday') {
            const date = new Date(this.now);
            date.setDate(date.getDate() - 1);
            return date;
        }
        
        if (cleanStr === 'tomorrow') {
            const date = new Date(this.now);
            date.setDate(date.getDate() + 1);
            return date;
        }

        // Handle "last week", "this week", "next week"
        const weekMatch = cleanStr.match(/^(last|this|next)\s+week$/);
        if (weekMatch) {
            return this.parseWeekExpression(weekMatch[1]);
        }

        // Handle "X days ago", "X weeks ago", "X months ago"
        const agoMatch = cleanStr.match(/^(\d+)\s+(day|week|month)s?\s+ago$/);
        if (agoMatch) {
            return this.parseAgoExpression(parseInt(agoMatch[1]), agoMatch[2]);
        }

        // Handle day names (e.g., "monday", "tuesday")
        const dayMatch = this.parseDayName(cleanStr);
        if (dayMatch) {
            return dayMatch;
        }

        // Handle "last Monday", "next Friday", etc.
        const relativeDay = cleanStr.match(/^(last|this|next)\s+(\w+)$/);
        if (relativeDay) {
            const dayName = relativeDay[2];
            if (this.dayNames.hasOwnProperty(dayName)) {
                return this.parseRelativeDayName(relativeDay[1], dayName);
            }
        }

        // Handle month expressions like "January", "last January", "next March"
        const monthMatch = cleanStr.match(/^(?:(last|this|next)\s+)?(\w+)$/);
        if (monthMatch && this.monthNames.hasOwnProperty(monthMatch[2])) {
            return this.parseMonthExpression(monthMatch[1] || 'this', monthMatch[2]);
        }

        // Handle "beginning of the week", "end of the week"
        if (cleanStr.includes('beginning of') || cleanStr.includes('start of')) {
            if (cleanStr.includes('week')) {
                return this.getStartOfWeek();
            }
            if (cleanStr.includes('month')) {
                return this.getStartOfMonth();
            }
        }

        if (cleanStr.includes('end of')) {
            if (cleanStr.includes('week')) {
                return this.getEndOfWeek();
            }
            if (cleanStr.includes('month')) {
                return this.getEndOfMonth();
            }
        }

        return null;
    }

    /**
     * Parse a day name to the most recent occurrence
     * @param {string} dayName - Name of the day
     * @returns {Date|null} Date of the most recent occurrence
     */
    parseDayName(dayName) {
        if (!this.dayNames.hasOwnProperty(dayName)) {
            return null;
        }

        const targetDay = this.dayNames[dayName];
        const today = new Date(this.now);
        const currentDay = today.getDay();
        
        // Calculate days back to the most recent occurrence
        let daysBack = currentDay - targetDay;
        if (daysBack <= 0) {
            daysBack += 7; // Go to previous week if it's today or in the future
        }
        
        const resultDate = new Date(today);
        resultDate.setDate(today.getDate() - daysBack);
        return resultDate;
    }

    /**
     * Parse relative day expressions like "last Monday", "next Friday"
     * @param {string} relative - "last", "this", or "next"
     * @param {string} dayName - Name of the day
     * @returns {Date|null} Parsed date
     */
    parseRelativeDayName(relative, dayName) {
        if (!this.dayNames.hasOwnProperty(dayName)) {
            return null;
        }

        const targetDay = this.dayNames[dayName];
        const today = new Date(this.now);
        const currentDay = today.getDay();
        
        let daysOffset;
        
        switch (relative) {
            case 'last':
                daysOffset = currentDay - targetDay;
                if (daysOffset <= 0) {
                    daysOffset += 7;
                }
                daysOffset = -daysOffset; // Make it negative for past
                break;
                
            case 'this':
                daysOffset = targetDay - currentDay;
                break;
                
            case 'next':
                daysOffset = targetDay - currentDay;
                if (daysOffset <= 0) {
                    daysOffset += 7;
                }
                break;
                
            default:
                return null;
        }
        
        const resultDate = new Date(today);
        resultDate.setDate(today.getDate() + daysOffset);
        return resultDate;
    }

    /**
     * Parse week expressions like "last week", "this week"
     * @param {string} relative - "last", "this", or "next"
     * @returns {Date} Date representing the week
     */
    parseWeekExpression(relative) {
        const today = new Date(this.now);
        let weeksOffset = 0;
        
        switch (relative) {
            case 'last':
                weeksOffset = -1;
                break;
            case 'this':
                weeksOffset = 0;
                break;
            case 'next':
                weeksOffset = 1;
                break;
        }
        
        const resultDate = new Date(today);
        resultDate.setDate(today.getDate() + (weeksOffset * 7));
        return resultDate;
    }

    /**
     * Parse "X days/weeks/months ago" expressions
     * @param {number} amount - Number of units
     * @param {string} unit - "day", "week", or "month"
     * @returns {Date} Calculated past date
     */
    parseAgoExpression(amount, unit) {
        const date = new Date(this.now);
        
        switch (unit) {
            case 'day':
                date.setDate(date.getDate() - amount);
                break;
            case 'week':
                date.setDate(date.getDate() - (amount * 7));
                break;
            case 'month':
                date.setMonth(date.getMonth() - amount);
                break;
        }
        
        return date;
    }

    /**
     * Parse month expressions
     * @param {string} relative - "last", "this", or "next"
     * @param {string} monthName - Name of the month
     * @returns {Date} Date in the specified month
     */
    parseMonthExpression(relative, monthName) {
        const targetMonth = this.monthNames[monthName];
        const today = new Date(this.now);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let year = currentYear;
        
        switch (relative) {
            case 'last':
                year = targetMonth > currentMonth ? currentYear - 1 : currentYear;
                if (targetMonth === currentMonth) year = currentYear - 1;
                break;
            case 'this':
                year = currentYear;
                break;
            case 'next':
                year = targetMonth < currentMonth ? currentYear + 1 : currentYear;
                if (targetMonth === currentMonth) year = currentYear + 1;
                break;
        }
        
        return new Date(year, targetMonth, 1);
    }

    /**
     * Get the start of the current week (Sunday)
     * @returns {Date} Start of week date
     */
    getStartOfWeek() {
        const date = new Date(this.now);
        const day = date.getDay();
        date.setDate(date.getDate() - day);
        return date;
    }

    /**
     * Get the end of the current week (Saturday)
     * @returns {Date} End of week date
     */
    getEndOfWeek() {
        const date = new Date(this.now);
        const day = date.getDay();
        date.setDate(date.getDate() + (6 - day));
        return date;
    }

    /**
     * Get the start of the current month
     * @returns {Date} Start of month date
     */
    getStartOfMonth() {
        const date = new Date(this.now);
        date.setDate(1);
        return date;
    }

    /**
     * Get the end of the current month
     * @returns {Date} End of month date
     */
    getEndOfMonth() {
        const date = new Date(this.now);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date;
    }

    /**
     * Format date to ISO string for consistent storage
     * @param {Date} date - Date to format
     * @returns {string} ISO date string
     */
    toISOString(date) {
        if (!date || isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    /**
     * Parse and normalize a datetime string
     * @param {string} dateTimeStr - Input datetime string
     * @returns {string} Normalized ISO date string or original string if unparseable
     */
    parseAndNormalize(dateTimeStr) {
        const parsedDate = this.parse(dateTimeStr);
        if (parsedDate) {
            return this.toISOString(parsedDate);
        }
        return dateTimeStr; // Return original if unparseable
    }

    /**
     * Test if a string contains natural language date expressions
     * @param {string} str - String to test
     * @returns {boolean} True if contains natural language dates
     */
    containsNaturalLanguage(str) {
        if (!str || typeof str !== 'string') return false;
        
        const cleanStr = str.toLowerCase().trim();
        const patterns = [
            /\b(today|yesterday|tomorrow)\b/,
            /\b(last|this|next)\s+(week|month)\b/,
            /\b\d+\s+(day|week|month)s?\s+ago\b/,
            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
            /\b(beginning|start|end)\s+of\s+(week|month)\b/
        ];
        
        return patterns.some(pattern => pattern.test(cleanStr));
    }
}

// Export for use in other modules
window.DateTimeParser = DateTimeParser;
