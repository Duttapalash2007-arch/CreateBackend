import axios from 'axios';
import { envConfig } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const MAX_RESULTS = 8;
const SEARCH_RADII_KM = [50, 100, 200, 350, 500];

export class MapService {
  static async geocodeAddress(address) {
    try {
      if (!envConfig.googleMapsApiKey) {
        logger.error('Google Maps API key is missing');
        return null;
      }

      if (!address?.trim()) {
        return null;
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address,
          key: envConfig.googleMapsApiKey,
        },
      });

      if (response.data.status !== 'OK') {
        logger.error(
          `Google Geocoding failed: status=${response.data.status}, message=${response.data.error_message || 'none'}`
        );
        return null;
      }

      const result = response.data.results?.[0];
      if (!result?.geometry?.location) {
        return null;
      }

      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      logger.error(`Error geocoding address: ${error.message}`);
      return null;
    }
  }

  static async findNearbyCareProviders(disease, latitude, longitude, radiusKm = 50, patientAddress = '') {
    try {
      if (!envConfig.googleMapsApiKey) {
        logger.error('Google Maps API key is missing');
        return [];
      }

      const specialty = this._getDoctorSpecialty(disease);
      const radiiToTry = Array.from(new Set([radiusKm, ...SEARCH_RADII_KM])).sort((a, b) => a - b);
      let selectedRadius = radiusKm;
      let nearestPlaces = [];

      for (const currentRadius of radiiToTry) {
        const places = await this._searchProvidersByRadius({
          disease,
          specialty,
          latitude,
          longitude,
          radiusKm: currentRadius,
        });

        if (places.length) {
          selectedRadius = currentRadius;
          nearestPlaces = places;
          break;
        }
      }

      if (!nearestPlaces.length) {
        nearestPlaces = await this._searchProvidersByText({
          disease,
          specialty,
          latitude,
          longitude,
          patientAddress,
        });

        if (nearestPlaces.length) {
          selectedRadius = Math.max(...nearestPlaces.map((place) => place.distance || radiusKm), radiusKm);
        }
      }

      if (!nearestPlaces.length) {
        logger.info('No care providers found after nearby and text search fallbacks');
        return [];
      }

      const detailedPlaces = await Promise.all(
        nearestPlaces.slice(0, MAX_RESULTS).map(async (place) => {
          const details = await this.getDoctorDetails(place.place_id);

          return {
            name: place.name,
            specialty: place.specialty,
            placeType: place.placeType,
            address: details?.address || place.formatted_address || place.vicinity || 'Address not available',
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: details?.rating || place.rating || 0,
            distance: place.distance,
            phoneNumber: details?.phoneNumber || 'Not available',
            website: details?.website || '',
            hours: details?.hours || [],
            googlePlaceId: place.place_id,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            searchRadiusKm: Math.ceil(selectedRadius),
          };
        })
      );

      logger.info(`Found ${detailedPlaces.length} care providers after Google Maps search`);
      return detailedPlaces;
    } catch (error) {
      logger.error(`Error finding nearby care providers: ${error.message}`);
      return [];
    }
  }

  static async getDoctorDetails(placeId) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating',
          key: envConfig.googleMapsApiKey,
        },
      });

      if (response.data.status !== 'OK') {
        logger.warn(
          `Google Place Details failed for ${placeId}: status=${response.data.status}, message=${response.data.error_message || 'none'}`
        );
        return null;
      }

      const place = response.data.result;
      if (!place) {
        return null;
      }

      return {
        name: place.name,
        address: place.formatted_address,
        phoneNumber: place.formatted_phone_number,
        website: place.website,
        hours: place.opening_hours?.weekday_text || [],
        rating: place.rating,
      };
    } catch (error) {
      logger.error(`Error getting provider details: ${error.message}`);
      return null;
    }
  }

  static formatProviderSummary(providers = []) {
    if (!providers.length) {
      return 'No nearby doctors or hospitals were found from the available Google Maps location search.';
    }

    const maxSearchRadius = Math.max(...providers.map((provider) => provider.searchRadiusKm || 50));

    return providers
      .slice(0, 4)
      .map((provider, index) =>
        `${index + 1}. ${provider.name} (${provider.placeType}) - ${provider.specialty}, ${provider.distance} km away, phone: ${provider.phoneNumber}, address: ${provider.address}`
      )
      .join('\n')
      .concat(maxSearchRadius > 50 ? `\nSearch expanded beyond 50 km up to ${maxSearchRadius} km to find available providers.` : '');
  }

  static async _searchProvidersByRadius({ disease, specialty, latitude, longitude, radiusKm }) {
    const searchQueries = [
      { type: 'doctor', keyword: specialty },
      { type: 'doctor', keyword: `${disease} specialist` },
      { type: 'doctor', keyword: `${disease} doctor` },
      { type: 'doctor', keyword: 'general physician' },
      { type: 'hospital', keyword: `${specialty} hospital` },
      { type: 'hospital', keyword: `${disease} hospital` },
      { type: 'hospital', keyword: 'hospital' },
      { type: 'hospital', keyword: 'clinic' },
    ];

    const searchResponses = await Promise.all(
      searchQueries.map((query) =>
        axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${latitude},${longitude}`,
            radius: radiusKm * 1000,
            type: query.type,
            keyword: query.keyword,
            key: envConfig.googleMapsApiKey,
          },
        })
      )
    );

    searchResponses.forEach((response, index) => {
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.warn(
          `Google Nearby Search failed for "${searchQueries[index].keyword}": status=${response.data.status}, message=${response.data.error_message || 'none'}`
        );
      }
    });

    const mergedPlaces = searchResponses
      .flatMap((response, index) =>
        (response.data.results || []).map((place) => ({
          ...place,
          placeType: searchQueries[index].type,
          specialty,
        }))
      )
      .filter((place) => place.geometry?.location);

    return this._dedupeAndRankPlaces(mergedPlaces, latitude, longitude, radiusKm);
  }

  static async _searchProvidersByText({ disease, specialty, latitude, longitude, patientAddress }) {
    const locationHint = patientAddress || `${latitude},${longitude}`;
    const textQueries = [
      `${specialty} near ${locationHint}`,
      `${disease} specialist near ${locationHint}`,
      `${disease} doctor near ${locationHint}`,
      `general physician near ${locationHint}`,
      `hospital near ${locationHint}`,
      `${disease} hospital near ${locationHint}`,
      `clinic near ${locationHint}`,
    ];

    const responses = await Promise.all(
      textQueries.map((query) =>
        axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
          params: {
            query,
            key: envConfig.googleMapsApiKey,
          },
        })
      )
    );

    responses.forEach((response, index) => {
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.warn(
          `Google Text Search failed for "${textQueries[index]}": status=${response.data.status}, message=${response.data.error_message || 'none'}`
        );
      }
    });

    const mergedPlaces = responses
      .flatMap((response, index) =>
        (response.data.results || []).map((place) => ({
          ...place,
          placeType: this._inferPlaceType(textQueries[index]),
          specialty,
        }))
      )
      .filter((place) => place.geometry?.location);

    return this._dedupeAndRankPlaces(mergedPlaces, latitude, longitude, 1000);
  }

  static _dedupeAndRankPlaces(places, latitude, longitude, radiusKm) {
    const uniquePlaces = Array.from(new Map(places.map((place) => [place.place_id, place])).values());

    return uniquePlaces
      .map((place) => ({
        ...place,
        distance: this._calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
      }))
      .filter((place) => place.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);
  }

  static _inferPlaceType(query) {
    return /hospital|clinic/i.test(query) ? 'hospital' : 'doctor';
  }

  static _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  static _getDoctorSpecialty(disease) {
    const specialtyMap = {
      Cancer: 'Oncologist',
      Allergy: 'Allergist Immunologist',
      Malaria: 'Infectious Disease Specialist',
      Diabetes: 'Endocrinologist',
      HIV: 'Infectious Disease Specialist',
      AIDS: 'Infectious Disease Specialist',
    };
    return specialtyMap[disease] || 'General Physician';
  }
}
