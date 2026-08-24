import { LOCATION_CONFIG } from "../config/constants";

export type LocationSuggestion = {
  text?: string;
  magicKey?: string;
  isCollection?: boolean;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * ArcGIS `suggest` — returns display text plus a magicKey used to resolve
 * coordinates. Never throws; an empty list means "no suggestions".
 */
export const fetchLocationSuggestions = async (
  query: string,
  minLength: number = 3,
): Promise<LocationSuggestion[]> => {
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < minLength) {
    return [];
  }

  try {
    const response = await fetch(
      `${LOCATION_CONFIG.geocodeSuggestUrl}?text=${encodeURIComponent(
        trimmed,
      )}&f=json`,
    );
    const data = await response.json();

    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return [];
  }
};

/**
 * Resolves a suggestion (or a plain address string) to latitude/longitude via
 * ArcGIS `findAddressCandidates`. Returns null when nothing can be geocoded —
 * callers should then send the location string without coordinates.
 */
export const geocodeLocation = async (
  suggestion: LocationSuggestion | string,
): Promise<Coordinates | null> => {
  const singleLine =
    typeof suggestion === "string" ? suggestion : suggestion?.text || "";
  const magicKey =
    typeof suggestion === "string" ? undefined : suggestion?.magicKey;

  if (!singleLine.trim() && !magicKey) {
    return null;
  }

  const params = [
    "f=json",
    "maxLocations=1",
    `singleLine=${encodeURIComponent(singleLine)}`,
  ];

  if (magicKey) {
    params.push(`magicKey=${encodeURIComponent(magicKey)}`);
  }

  try {
    const response = await fetch(
      `${LOCATION_CONFIG.geocodeFindUrl}?${params.join("&")}`,
    );
    const data = await response.json();
    const candidate = Array.isArray(data?.candidates)
      ? data.candidates[0]
      : null;

    const longitude = Number(candidate?.location?.x);
    const latitude = Number(candidate?.location?.y);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
};

/**
 * `distance` comes back from the matching endpoints in **kilometres**
 * (`haversineKm`, confirmed by the API team). The product displays **miles**
 * (US market), so the conversion happens here — this is the single place that
 * knows either unit. Returns null when there is nothing to show (the other user
 * has no coordinates yet).
 */
const KM_PER_MILE = 1.609344;
export const formatDistance = (
  distance?: number | string | null,
): string | null => {
  const value = typeof distance === "string" ? Number(distance) : distance;

  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const miles = value / KM_PER_MILE;

  if (miles < 0.1) {
    return "Nearby";
  }

  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi away`;
};
