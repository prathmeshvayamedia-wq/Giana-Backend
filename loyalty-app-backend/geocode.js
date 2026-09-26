const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// Converts lat/long into a human-readable address like "Shivaji Nagar, Pune,
// Maharashtra". Uses OpenStreetMap's free Nominatim service - no API key
// needed, but rate-limited to ~1 request/second on their public server, so
// this is fine for current scale but would need Google Maps Geocoding API
// (paid) if scan volume grows significantly.
async function reverseGeocode(latitude, longitude) {
  if (!latitude || !longitude) return null;

  try {
    const url = `${NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires a descriptive User-Agent -
        // requests without one can get silently blocked.
        'User-Agent': 'GianaRewardsApp/1.0',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.display_name || null;
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    return null;
  }
}

module.exports = { reverseGeocode };