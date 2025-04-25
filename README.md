# Kansas Cities Map

This project displays an interactive map primarily focused on cities in Kansas using Mapbox GL JS. It fetches city data, geocodes them, displays them on a map with custom markers, and dynamically adjusts the view and layout.

## Features

- **Interactive Map:** Uses Mapbox GL JS to display a street map.
- **City Data Loading:** Fetches city names from `cities.json`.
- **Geocoding:** Converts city names to coordinates using the Mapbox Geocoding API.
- **Cluster Focusing:** Calculates the geographical center and standard deviation of city locations to intelligently focus the map view on the main cluster, ignoring distant outliers for the initial zoom.
- **Custom Markers & Popups:** Displays custom SVG markers for each city; shows city name in a popup on hover.
- **Clickable Elements:** List items and map markers link to simulated city-specific pages (e.g., `/city-name`).
- **Dynamic Layout:** Automatically adjusts the margin below the map section based on the height of the city list overlay, ensuring consistent spacing with the subsequent section, especially on different screen sizes.
- **Call to Action Section:** Includes a full-width section with a background image and buttons below the map.
- **Footer:** Multi-column footer with logo, social links (sprite), contact info, and navigation links.
- **Responsive Design:** Uses Bootstrap 5 and custom media queries for layout adjustments on different screen sizes (e.g., 2-column city list on small screens, stacked footer columns).

## Setup Instructions

1.  **Clone the repository** or download the files.
2.  **Mapbox Access Token:** Replace the placeholder `MAPBOX_ACCESS_TOKEN` constant at the top of `script.js` with your own Mapbox access token. **Note:** For production, this token should be secured (e.g., using environment variables or a backend proxy) rather than hardcoded in client-side JavaScript.
3.  **Dependencies:** The project uses CDNs for Bootstrap 5 and Mapbox GL JS, so no `npm install` is strictly necessary unless you plan to manage dependencies locally.
4.  **Local Server:** Open `index.html` directly in your browser, or serve the directory using a simple local web server (e.g., `python -m http.server` or the Live Server extension in VS Code). Using a server is recommended to avoid potential issues with `fetch` requests for `cities.json` due to local file security restrictions in some browsers.

## Configuration

- **`script.js`**: 
    - `MAPBOX_ACCESS_TOKEN`: Your Mapbox token.
    - `MAP_PADDING`: Controls the padding around the map bounds when focusing.
    - `adjustLayout()`: Contains logic for dynamic margin calculation (baseline overlay height, desired gap).
- **`cities.json`**: A simple JSON array of objects, each requiring a `"name"` key (e.g., `{ "name": "Wichita" }`).
- **`styles.css`**: Contains all custom styling, including responsive breakpoints and footer social icon sprite positions (adjust `background-position` if your sprite layout differs).

## Required Assets

Ensure the following files are present in the `images/` directory:
- `icon-pin.svg` (for map markers)
- `s9.jpg` (for CTA background)
- `social-icons.png` (sprite for footer social links)

## Project Structure

- `index.html`: Main HTML file containing the page structure.
- `styles.css`: Custom CSS styles and responsive rules.
- `script.js`: JavaScript for map initialization, data loading, geocoding, marker creation, dynamic layout adjustments, and event handling.
- `cities.json`: List of cities to display.
- `images/`: Directory for image assets.
- `README.md`: This file.

## Dependencies (via CDN)

- [Bootstrap 5](https://getbootstrap.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) 