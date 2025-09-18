# Network Graph CSV Analyzer

A web-based application for analyzing CSV data containing Actor-Action-Target relationships with advanced filtering, sorting, and visualization capabilities.

## Project Structure

```
network-graph/
├── index.html          # Main HTML application structure
├── styles.css          # External CSS stylesheet with CSS variables
├── js/                 # JavaScript modules directory
│   ├── app.js          # Main application controller
│   ├── actor-pill-renderer.js # Actor classification pill rendering
│   ├── csv-parser.js   # CSV parsing utilities
│   ├── data-manager.js # Data filtering, sorting, and management
│   ├── file-handler.js # File upload and drag/drop handling
│   ├── map-renderer.js # Map visualization using Leaflet.js
│   ├── ui-controller.js # UI controls and interactions
│   ├── view-renderers.js # View rendering functions
│   └── wikidata-classifier.js # Wikidata API integration for actor classification
├── sample-data.csv     # Sample CSV data for testing
└── README.md           # This documentation file
```

## Features

### 📁 File Upload
- Drag and drop CSV files or click to browse
- Automatic CSV parsing with support for quoted fields
- Expected columns: Actor, Action, Target, Sentence, Date Received, Locations, Datetimes

### 🔍 Data Views
1. **Summary View**: Overview statistics showing total records, unique actors, targets, and locations
2. **Table View**: Traditional spreadsheet-style data display with sortable columns
3. **Map View**: Geographic visualization of data points based on location information
4. **Aggregations View**: Grouped data by Actor, Target, and Location with item counts

### 🎛️ Filtering & Sorting
- **Filter by Actor**: Show only records for specific actors
- **Filter by Target**: Show only records for specific targets  
- **Filter by Location**: Show only records containing specific locations
- **Sort Options**: Sort by datetime, actor, target, or action
- **Sort Order**: Ascending or descending

### 📊 Data Analysis Features
- **Actor Aggregation**: Group records by shared actors
- **Target Aggregation**: Group records by shared targets
- **Location Aggregation**: Group records by shared locations (supports multiple locations per record)
- **Real-time Statistics**: Live updates of unique counts and totals
- **Interactive Filtering**: All views update automatically when filters change

### 🗺️ Map Visualization Features
- **Geographic Display**: Visualizes data points on an interactive map based on location information
- **Automatic Geocoding**: Converts location names to coordinates using OpenStreetMap's Nominatim service
- **Smart Markers**: Marker size reflects the number of activities at each location
- **Detailed Popups**: Click markers to see activity summaries and recent events
- **Responsive Design**: Optimized for both desktop and mobile viewing
- **Location Caching**: Geocoded locations are cached for improved performance

### 🏷️ Actor Classification Features
- **Wikidata Integration**: Automatically classifies actors using Wikidata's "instance of" property
- **Smart Categorization**: Identifies actors as countries, regions, people, or organizations
- **Color-Coded Pills**: Visual pills with distinct colors for each actor type:
  - 🔵 **Blue**: Countries and regions
  - 🟢 **Green**: People and individuals
  - 🟣 **Purple**: Organizations and companies
  - ⚪ **Grey**: Unknown or unclassified entities
- **Intelligent Caching**: Classification results are cached to improve performance
- **Rate Limiting**: Respects Wikidata API limits with built-in delays

## CSS Architecture

### CSS Variables
The application uses a minimalist design system with CSS custom properties for consistent theming:

```css
:root {
    /* Action/Interactive color - Blue */
    --action-blue: #2563eb;
    --action-blue-hover: #1d4ed8;
    --action-blue-light: #dbeafe;
    --action-blue-subtle: rgba(37, 99, 235, 0.1);
    
    /* Background colors - Greys and White */
    --bg-white: #ffffff;
    --bg-light: #f9fafb;
    --bg-medium: #f3f4f6;
    --bg-dark: #e5e7eb;
    
    /* Border colors - Greys */
    --border-light: #e5e7eb;
    --border-medium: #d1d5db;
    --border-dark: #9ca3af;
    
    /* Text colors - Greys */
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    --text-white: #ffffff;
}
```

### Design Philosophy
- **Minimalist Approach**: Clean, uncluttered interface focusing on functionality
- **Blue for Actions**: All interactive elements (buttons, links, active states) use blue
- **Grey Scale**: Everything else uses various shades of grey for a professional look
- **Subtle Shadows**: Minimal use of shadows for depth without distraction
- **Consistent Spacing**: Systematic spacing using multiples of 4px/8px

### Customization
To customize the design:
1. **Color Scheme**: Modify CSS variables in the `:root` section of `styles.css`
2. **Action Color**: Change `--action-blue` variables to use a different accent color
3. **Grey Scale**: Adjust background and text grey values for different contrast levels
4. **Spacing**: Modify padding and margin values throughout the stylesheet

### Benefits of Minimalist Design
- **Focus on Content**: Reduced visual noise helps users focus on data
- **Professional Appearance**: Clean grey and blue palette looks professional
- **Easy to Scan**: Clear hierarchy and consistent spacing improve readability
- **Accessible**: High contrast ratios and clear interactive elements
- **Timeless**: Minimalist design doesn't go out of style

## How to Use

1. **Open the Application**: Open `index.html` in any modern web browser
2. **Upload CSV**: Either drag and drop your CSV file onto the upload area or click "Choose File"
3. **Explore Data**: Use the tabs to switch between different views:
   - 📊 Summary: Get an overview of your data
   - 📋 Table View: See all records in a traditional table format
   - 🗺️ Map View: Visualize data geographically based on location information
   - 📈 Aggregations: Analyze grouped data by shared attributes
4. **Filter & Sort**: Use the control panel to filter by specific actors, targets, or locations, and sort the data as needed

## Sample Data

A sample CSV file (`sample-data.csv`) is included to help you test the application. It contains example data showing various actors, actions, and targets with associated metadata.

## CSV Format Requirements

Your CSV should have the following columns (order doesn't matter):
- **Actor**: The entity performing the action
- **Action**: The action being performed
- **Target**: The entity being acted upon
- **Sentence**: Descriptive text about the relationship
- **Date Received**: When the data was received
- **Locations**: Geographic locations (can be comma-separated for multiple locations)
- **Datetimes**: Timestamp information for sorting

## Browser Compatibility

This application works in all modern browsers including:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## JavaScript Architecture

The application uses a modular JavaScript architecture with clear separation of concerns:

### 📁 **Module Overview**

#### `csv-parser.js` - CSV Parsing Utilities
- **Purpose**: Handles parsing of CSV files into JavaScript objects
- **Key Features**:
  - Robust CSV line parsing with quoted field support
  - File validation
  - Unique value extraction utilities
- **Main Class**: `CSVParser`

#### `file-handler.js` - File Upload Management
- **Purpose**: Manages file upload and drag-and-drop functionality
- **Key Features**:
  - Drag and drop event handling
  - File validation and error handling
  - FileReader API integration
- **Main Class**: `FileHandler`

#### `data-manager.js` - Data Operations
- **Purpose**: Handles all data storage, filtering, and sorting operations
- **Key Features**:
  - Data filtering by actor, target, and location
  - Multi-field sorting capabilities
  - Data aggregation and grouping
  - Statistics calculation
- **Main Class**: `DataManager`

#### `wikidata-classifier.js` - Actor Classification
- **Purpose**: Integrates with Wikidata API to classify actors by type
- **Key Features**:
  - SPARQL queries to Wikidata for "instance of" properties
  - Intelligent classification into countries, regions, people, or organizations
  - Rate limiting and error handling for API requests
  - Results caching for improved performance
- **Main Class**: `WikidataClassifier`

#### `actor-pill-renderer.js` - Actor Pill Display
- **Purpose**: Renders color-coded pills for classified actors
- **Key Features**:
  - Visual pill components with classification-based colors
  - Integration with all data views (table, map, aggregation)
  - Loading states and real-time updates
  - Multiple pill sizes for different contexts
- **Main Class**: `ActorPillRenderer`

#### `map-renderer.js` - Map Visualization
- **Purpose**: Handles geographic visualization using Leaflet.js
- **Key Features**:
  - Interactive map with OpenStreetMap tiles
  - Location geocoding using Nominatim service
  - Clustered markers with popups showing activity details
  - Actor pill integration in map popups
  - Responsive design with mobile optimization
- **Main Class**: `MapRenderer`

#### `view-renderers.js` - View Rendering
- **Purpose**: Renders different data views and manages display logic
- **Key Features**:
  - Summary statistics rendering
  - Table view generation
  - Map view coordination
  - Aggregation view with grouping
- **Main Class**: `ViewRenderers` (static methods)

#### `ui-controller.js` - UI Interactions
- **Purpose**: Manages UI controls, form interactions, and user events
- **Key Features**:
  - Filter dropdown population
  - Event listener management
  - Control state management
- **Main Class**: `UIController`

#### `app.js` - Application Controller
- **Purpose**: Main application orchestrator that coordinates all modules
- **Key Features**:
  - Application initialization
  - Module coordination
  - Error handling
  - Data export functionality
- **Main Class**: `NetworkGraphApp`

### 🔄 **Data Flow**

1. **File Upload**: `FileHandler` → `CSVParser` → `DataManager`
2. **User Interaction**: `UIController` → `DataManager` → `ViewRenderers`
3. **View Updates**: `DataManager` → `ViewRenderers` → DOM

### 🛠️ **Extensibility**

The modular architecture makes it easy to:
- Add new data views by extending `ViewRenderers`
- Implement new data sources by creating parsers similar to `CSVParser`
- Add new filtering options by extending `DataManager`
- Integrate with external APIs through `NetworkGraphApp`

## Technical Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Drag & Drop**: Modern file upload interface
- **Real-time Updates**: All views update instantly when filters change
- **Memory Efficient**: Handles large CSV files efficiently
- **Minimal Dependencies**: Uses only Leaflet.js for mapping functionality
- **CSS Variables**: Modern CSS architecture for easy customization
- **Modular Architecture**: Clean separation of concerns across multiple JavaScript modules
- **Error Handling**: Comprehensive error handling throughout the application
- **Offline Capable**: Works offline after initial load (except for map geocoding)

## External Dependencies

- **Leaflet.js v1.9.4**: Open-source JavaScript library for interactive maps
- **OpenStreetMap**: Provides map tiles and geocoding services
- **Nominatim**: OpenStreetMap's geocoding service for converting location names to coordinates
- **Wikidata Query Service**: SPARQL endpoint for actor classification queries
- **Wikidata**: Knowledge base providing structured data about entities

## Development

### File Structure
- `index.html`: Contains the application HTML structure only
- `styles.css`: Contains all styling with CSS variables for theming
- `js/`: Modular JavaScript files organized by functionality
- `sample-data.csv`: Test data for development and demonstration

### Development Workflow

#### Adding New Features
1. **New Data Views**: Extend `ViewRenderers` class with new static methods
2. **New Filters**: Add filter logic to `DataManager` and UI controls to `UIController`
3. **New Data Sources**: Create new parser classes following `CSVParser` pattern
4. **New Interactions**: Add event handlers to `UIController` or create new controller modules

#### Debugging
- All modules are available in the global `window` object for debugging
- Main app instance is available as `window.app`
- Console logging is implemented throughout for troubleshooting

#### Testing
- Use the provided `sample-data.csv` for testing
- Each module can be tested independently
- Browser developer tools provide full access to all classes and methods

### Adding New Themes
To add a new color theme:
1. Create a new CSS class that overrides the CSS variables
2. Add theme switching functionality to the JavaScript
3. Apply the theme class to the `body` or root element

Example:
```css
.dark-theme {
    --bg-white: #1a1a1a;
    --text-dark: #ffffff;
    --bg-light-gray: #2d2d2d;
    /* ... other variable overrides */
}
```

## Future Enhancement Opportunities

- Multiple color themes (dark mode, high contrast, etc.)
- Export filtered data to CSV
- Data visualization charts and graphs
- Advanced search functionality
- Network graph visualization
- Timeline view for datetime-based analysis
- Bulk data operations
- Custom CSS variable editor in the UI