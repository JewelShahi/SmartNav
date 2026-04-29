import axios from 'axios';
import NodeCache from 'node-cache';

// Cache geocoding results for 1 hour to reduce API calls
const geocodeCache = new NodeCache({ stdTTL: 3600 });

/**
 * Geocode an address string to lat/lng using multiple providers with fallback.
 * Priority: OpenCage → Nominatim
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address input');
  }

  const normalized = address.trim().toLowerCase();
  const cacheKey = `geocode:${normalized}`;

  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    console.log(`[Geocode] Cache hit for: ${address}`);
    return cached;
  }

  let result = null;

  // OpenCage first
  if (process.env.OPENCAGE_API_KEY) {
    try {
      result = await geocodeWithOpenCage(address);
    } catch (err) {
      console.warn('[Geocode] OpenCage failed, falling back:', err.message);
    }
  }

  // Fallback Nominatim
  if (!result) {
    try {
      result = await geocodeWithNominatim(address);
    } catch (err) {
      console.warn('[Geocode] Nominatim failed:', err.message);
    }
  }

  if (!result) {
    throw new Error(`Could not geocode address: "${address}"`);
  }

  geocodeCache.set(cacheKey, result);
  return result;
};

const geocodeWithOpenCage = async (address) => {
  const url = 'https://api.opencagedata.com/geocode/v1/json';

  const response = await axios.get(url, {
    params: {
      q: address,
      key: process.env.OPENCAGE_API_KEY,
      limit: 5,
      no_annotations: 0,
      language: 'en',
      countrycode: '',
    },
    timeout: 8000,
  });

  const { results, status } = response.data;

  if (status.code !== 200 || !results?.length) {
    throw new Error('OpenCage returned no results');
  }

  const best = results[0];

  return {
    lat: best.geometry.lat,
    lng: best.geometry.lng,
    formattedAddress: best.formatted,
    confidence: best.confidence,
    components: best.components,
    provider: 'opencage',
    allResults: results.map((r) => ({
      lat: r.geometry.lat,
      lng: r.geometry.lng,
      formattedAddress: r.formatted,
      confidence: r.confidence,
    })),
  };
};

const geocodeWithNominatim = async (address) => {
  const url = 'https://nominatim.openstreetmap.org/search';

  const response = await axios.get(url, {
    params: {
      q: address,
      format: 'jsonv2',
      limit: 5,
      addressdetails: 1,
      extratags: 1,
    },
    headers: {
      'User-Agent': 'DeliveryOptimizer/1.0 (contact@yourdomain.com)',
      'Accept-Language': 'en',
    },
    timeout: 10000,
  });

  const results = response.data;

  if (!results?.length) {
    throw new Error('Nominatim returned no results');
  }

  const best = results[0];

  return {
    lat: parseFloat(best.lat),
    lng: parseFloat(best.lon),
    formattedAddress: best.display_name,
    confidence: parseFloat(best.importance) * 10,
    components: best.address,
    provider: 'nominatim',
    allResults: results.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      formattedAddress: r.display_name,
      confidence: parseFloat(r.importance) * 10,
    })),
  };
};

/**
 * Autocomplete addresses
 */
export const autocompleteAddress = async (query, lat = null, lng = null) => {
  if (!query || query.length < 3) return [];

  const cacheKey = `autocomplete:${query.toLowerCase()}:${lat}:${lng}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  let results = [];

  try {
    results = await autocompleteWithPhoton(query, lat, lng);
  } catch (err) {
    console.warn('[Autocomplete] Photon failed:', err.message);
  }

  if (!results.length) {
    try {
      const geo = await geocodeWithNominatim(query);
      results = geo.allResults.slice(0, 5);
    } catch (err) {
      console.warn('[Autocomplete] Nominatim fallback failed:', err.message);
    }
  }

  geocodeCache.set(cacheKey, results, 300);
  return results;
};

const autocompleteWithPhoton = async (query, lat, lng) => {
  const params = { q: query, limit: 7, lang: 'en' };

  if (lat && lng) {
    params.lat = lat;
    params.lon = lng;
  }

  const response = await axios.get('https://photon.komoot.io/api/', {
    params,
    timeout: 5000,
  });

  const features = response.data?.features || [];

  return features.map((f) => {
    const props = f.properties;

    const parts = [
      props.name,
      props.street && props.housenumber
        ? `${props.street} ${props.housenumber}`
        : props.street,
      props.city || props.county,
      props.state,
      props.country,
    ].filter(Boolean);

    const uniqueParts = [...new Set(parts)];

    return {
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      formattedAddress: uniqueParts.join(', '),
      type: props.type || props.osm_value,
      provider: 'photon',
    };
  });
};

/**
 * Reverse geocoding
 */
export const reverseGeocode = async (lat, lng) => {
  const cacheKey = `reverse:${lat.toFixed(5)}:${lng.toFixed(5)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  let result = null;

  if (process.env.OPENCAGE_API_KEY) {
    try {
      const response = await axios.get(
        'https://api.opencagedata.com/geocode/v1/json',
        {
          params: {
            q: `${lat}+${lng}`,
            key: process.env.OPENCAGE_API_KEY,
            no_annotations: 1,
            language: 'en',
          },
          timeout: 8000,
        }
      );

      const results = response.data?.results;

      if (results?.length) {
        result = {
          formattedAddress: results[0].formatted,
          components: results[0].components,
          provider: 'opencage',
        };
      }
    } catch (err) {
      console.warn('[Reverse Geocode] OpenCage failed:', err.message);
    }
  }

  if (!result) {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat,
            lon: lng,
            format: 'jsonv2',
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'DeliveryOptimizer/1.0',
          },
          timeout: 8000,
        }
      );

      result = {
        formattedAddress: response.data.display_name,
        components: response.data.address,
        provider: 'nominatim',
      };
    } catch (err) {
      throw new Error('Reverse geocoding failed');
    }
  }

  geocodeCache.set(cacheKey, result);
  return result;
};