# Network Graph CSV Analyzer

A web-based application for analyzing CSV data containing Actor-Action-Target relationships with advanced filtering, sorting, and visualization capabilities.

## Project Structure

```
network-graph/
├── index.html          # Main HTML application structure
├── styles.css          # External CSS stylesheet with CSS variables
├── js/                 # JavaScript modules directory
│   ├── app.js          # Main application controller
│   ├── csv-parser.js   # CSV parsing utilities
│   ├── data-manager.js # Data filtering, sorting, and management
│   ├── file-handler.js # File upload and drag/drop handling
│   ├── ui-controller.js # UI controls and interactions
│   └── view-renderers.js # View rendering functions
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
3. **Card View**: Individual cards for each record with all field details
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

## CSS Architecture

### CSS Variables
The application uses CSS custom properties (variables) for consistent theming:

```css
:root {
    /* Primary colors */
    --primary-blue: #667eea;
    --primary-purple: #764ba2;
    --primary-gradient: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
    
    /* Background colors */
    --bg-white: white;
    --bg-light-gray: #f8f9fa;
    --bg-light-blue: #f8f9ff;
    --bg-lighter-blue: #f0f4ff;
    
    /* Border colors */
    --border-light: #eee;
    --border-medium: #ddd;
    
    /* Text colors */
    --text-dark: #333;
    --text-medium: #666;
    --text-white: white;
    
    /* Other colors */
    --shadow-light: rgba(0,0,0,0.1);
    --hover-blue: rgba(102, 126, 234, 0.1);
}
```

### Customization
To customize the color scheme:
1. Open `styles.css`
2. Modify the CSS variables in the `:root` section
3. Save the file - changes will apply automatically

### Benefits of CSS Variables
- **Easy theming**: Change colors globally by modifying variables
- **Consistency**: All components use the same color palette
- **Maintainability**: Single source of truth for design tokens
- **Dark mode ready**: Variables can be easily overridden for different themes

## How to Use

1. **Open the Application**: Open `index.html` in any modern web browser
2. **Upload CSV**: Either drag and drop your CSV file onto the upload area or click "Choose File"
3. **Explore Data**: Use the tabs to switch between different views:
   - 📊 Summary: Get an overview of your data
   - 📋 Table View: See all records in a traditional table format
   - 🗃️ Card View: Browse individual records as cards
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

#### `view-renderers.js` - View Rendering
- **Purpose**: Renders different data views and manages display logic
- **Key Features**:
  - Summary statistics rendering
  - Table view generation
  - Card view creation
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
- **No Dependencies**: Pure HTML, CSS, and JavaScript - no external libraries required
- **CSS Variables**: Modern CSS architecture for easy customization
- **Modular Architecture**: Clean separation of concerns across multiple JavaScript modules
- **Error Handling**: Comprehensive error handling throughout the application

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