// Replace with your Mapbox access
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYWVyb3NzYWxhZ2EiLCJhIjoiY205dmFtNW1lMGl2YTJrb3NqbTd2a3l3aCJ9.TD0TdxOjxlU4Po2I5SRADQ';

const DEFAULT_CENTER = [-98.5, 39.0];
const DEFAULT_ZOOM = 6;
const MAP_PADDING = { top: 100, bottom: 400, left: 100, right: 100 };

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM
});

let markers = [];
let cities = [];
let bounds = new mapboxgl.LngLatBounds();
let hasLoadedCities = false;
let clusterBounds = null;

async function loadCities() {
    try {
        const response = await fetch('cities.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        cities = await response.json();
        renderCityList();
        geocodeCities();
    } catch (error) {
        console.error('Error loading cities:', error);
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `<div class="alert alert-danger">Failed to load cities data. Please try again later.</div>`;
        }
    }
}

function toDashCase(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
}

function renderCityList() {
    const cityList = document.getElementById('city-list');
    if (!cityList) return;
    cityList.innerHTML = '';
    cities.forEach(city => {
        const item = document.createElement('li');
        item.textContent = city.name;
        item.addEventListener('click', () => {
            window.location.href = `/${toDashCase(city.name)}`;
        });
        cityList.appendChild(item);
    });
    adjustLayout();
}

// Function to adjust layout based on overlay height
function adjustLayout() {
    const mapSection = document.querySelector('.map-section');
    const citiesOverlay = document.querySelector('.cities-overlay');

    if (mapSection && citiesOverlay) {
        const overlayHeight = citiesOverlay.offsetHeight;
        const baselineOverlayHeight = 349; // The height threshold
        const baseMargin = 219;          // The base margin

        // Calculate how much taller the overlay is than the baseline
        const excessHeight = Math.max(0, overlayHeight - baselineOverlayHeight);

        // Calculate the final margin: base margin + any excess height
        const finalMargin = baseMargin + excessHeight;

        // Log the values for debugging
        console.log(`Overlay Height: ${overlayHeight}, Baseline Height: ${baselineOverlayHeight}, Excess Height: ${excessHeight.toFixed(2)}, Final Margin: ${finalMargin.toFixed(2)}`);

        // Set the calculated margin
        mapSection.style.marginBottom = `${finalMargin}px`;
    }
}

async function geocodeCities() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.add('d-flex');
        loadingEl.classList.remove('d-none');
    }

    try {
        await Promise.all(cities.map(city => geocodeCity(city)));
        const geocodedCities = cities.filter(c => c.longitude && c.latitude);

        if (geocodedCities.length === 0) {
            console.warn("No cities were successfully geocoded.");
            if (loadingEl) {
                loadingEl.innerHTML = `<div class="alert alert-warning">Could not find coordinates for any listed cities.</div>`;
                loadingEl.classList.remove('d-flex');
                loadingEl.classList.add('d-none');
            }
            return;
        }

        markers.forEach(marker => marker.remove());
        markers = [];
        geocodedCities.forEach(city => addMarker(city));

        const allBounds = new mapboxgl.LngLatBounds();
        geocodedCities.forEach(city => allBounds.extend([city.longitude, city.latitude]));
        clusterBounds = calculateClusterBounds(geocodedCities) || allBounds;

        map.fitBounds(clusterBounds, { padding: MAP_PADDING, maxZoom: 12 });

        if (loadingEl) {
            loadingEl.classList.remove('d-flex');
            loadingEl.classList.add('d-none');
        }
        hasLoadedCities = true;

    } catch (error) {
        console.error('Error geocoding cities:', error);
        if (loadingEl) {
            loadingEl.innerHTML = `<div class="alert alert-danger">Failed to geocode cities. Please try again later.</div>`;
        }
    }
}

function calculateDistance(coord1, coord2) {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateStdDev(values) {
    if (!values.length) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function calculateClusterBounds(geocodedCities) {
    if (geocodedCities.length <= 2) {
        const bounds = new mapboxgl.LngLatBounds();
        geocodedCities.forEach(city => bounds.extend([city.longitude, city.latitude]));
        return bounds.isEmpty() ? null : bounds;
    }

    const centroid = [
        geocodedCities.reduce((sum, c) => sum + c.longitude, 0) / geocodedCities.length,
        geocodedCities.reduce((sum, c) => sum + c.latitude, 0) / geocodedCities.length
    ];

    const distances = geocodedCities.map(city => calculateDistance([city.longitude, city.latitude], centroid));
    const stdDev = calculateStdDev(distances);
    const threshold = stdDev * 1.5;

    const clusteredCities = geocodedCities.filter((city, i) => distances[i] <= threshold);
    const citiesToUse = clusteredCities.length >= 3 ? clusteredCities : geocodedCities;

    const bounds = new mapboxgl.LngLatBounds();
    citiesToUse.forEach(city => bounds.extend([city.longitude, city.latitude]));
    return bounds.isEmpty() ? null : bounds;
}

async function geocodeCity(city) {
    if (!city.name || (city.longitude && city.latitude)) return;
    try {
        const query = `${city.name}, Kansas`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=1&country=US&types=place`;
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to geocode ${city.name}: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            city.longitude = lng;
            city.latitude = lat;
        } else {
            console.warn(`No results for ${city.name}`);
        }
    } catch (err) {
        console.error(`Error geocoding ${city.name}:`, err);
    }
    await new Promise(res => setTimeout(res, 50));
}

function addMarker(city) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = 'url(images/icon-pin.svg)';
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.width = '29px';
    el.style.height = '33px';

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([city.longitude, city.latitude])
        .addTo(map);

    const popup = new mapboxgl.Popup({ offset: [0, -30], closeButton: false })
        .setHTML(`<div class="popup-content"><h3>${city.name}</h3></div>`);

    el.addEventListener('mouseenter', () => {
        marker.setPopup(popup);
        popup.addTo(map);
    });

    el.addEventListener('mouseleave', () => {
        if (popup.isOpen()) popup.remove();
    });

    el.addEventListener('click', () => {
        window.location.href = `/${toDashCase(city.name)}`;
    });

    markers.push(marker);
}

function initMapControls() {
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
    }), 'top-right');
}

map.on('load', () => {
    initMapControls();
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.remove('d-flex');
        loadingEl.classList.add('d-none');
    }
    if (!hasLoadedCities) {
        loadCities();
    }
});

window.addEventListener('resize', () => {
    console.log("Resize event triggered");
    const boundsToFit = clusterBounds || (markers.length > 0 ? markers.reduce((b, m) => b.extend(m.getLngLat()), new mapboxgl.LngLatBounds()) : null);
    if (boundsToFit && !boundsToFit.isEmpty()) {
        map.fitBounds(boundsToFit, { padding: MAP_PADDING, maxZoom: 12 });
    }
    // Delay adjustLayout slightly to allow browser reflow after resize
    setTimeout(adjustLayout, 0);
});
