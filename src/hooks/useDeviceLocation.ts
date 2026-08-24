import { useEffect, useRef } from "react";
import * as Location from "expo-location";

import { useAuth } from "../contexts/AuthContext";
import { useUpdateMyProfileMutation } from "../services/api/userApi";

/**
 * Device location -> profile coordinates.
 *
 * The permission is requested **on app launch** (product decision), and the
 * coordinates are pushed to `PUT /user/update` once there is a signed-in user
 * to attach them to. Everything here is best-effort: a denied permission, a
 * timeout, or a failed request must never block the app or surface an error,
 * because nothing the user asked for is failing.
 *
 * Two deliberate rules:
 *
 * - **Coordinates only.** The `location` *text* on a profile stays whatever the
 *   user typed — device position never rewrites it. So a profile keeps saying
 *   "Brooklyn, NY" while distances are computed from where the phone actually
 *   is.
 * - **Declining is not a failure.** With no permission the app falls back to the
 *   coordinates geocoded from the typed address, which is how it worked before
 *   device location existed.
 */

/**
 * Coordinates are rounded to 3 decimal places (~110 m). Distances render at
 * mile granularity, so nothing is lost, and we avoid storing a position precise
 * enough to identify someone's front door.
 */
const COORDINATE_PRECISION = 3;

/** Don't re-send unless the phone has moved ~200 m since the stored pair. */
const MIN_DELTA_DEGREES = 0.002;

const round = (value: number): number => {
  const factor = 10 ** COORDINATE_PRECISION;
  return Math.round(value * factor) / factor;
};

export const useDeviceLocation = () => {
  const { isAuthenticated, user } = useAuth();
  const [updateMyProfile] = useUpdateMyProfileMutation();
  // One attempt per app run — this is a background courtesy, not a feature the
  // user is waiting on, so it must not retry in a loop.
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || attempted.current) {
      return;
    }
    attempted.current = true;

    let cancelled = false;

    const syncLocation = async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted || cancelled) {
          // Declined: the geocoded profile address remains the source of
          // coordinates. Nothing to report.
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          // Balanced is plenty for a distance shown in whole miles, and costs
          // far less battery than the high-accuracy fix.
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        const latitude = round(position.coords.latitude);
        const longitude = round(position.coords.longitude);

        const storedLat = user.latitude;
        const storedLon = user.longitude;
        const hasStored =
          typeof storedLat === "number" && typeof storedLon === "number";
        const movedEnough =
          !hasStored ||
          Math.abs(storedLat - latitude) >= MIN_DELTA_DEGREES ||
          Math.abs(storedLon - longitude) >= MIN_DELTA_DEGREES;

        if (!movedEnough) {
          return;
        }

        // `location` is deliberately absent from this payload — see the note
        // above. Only the coordinates move.
        const response = await updateMyProfile({ latitude, longitude }).unwrap();
        // This API answers 200 with { status: false } on failure, so a resolved
        // unwrap() is not proof. Nothing is shown either way; just don't log a
        // success that did not happen.
        if (response?.status === false) {
          console.warn(
            "Device location not saved:",
            response.message ?? "server rejected the update",
          );
        }
      } catch (error) {
        // Permission dialogs, location services being off, timeouts — all
        // expected and all silent.
        console.warn("Device location unavailable", error);
      }
    };

    syncLocation();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.latitude, user?.longitude, updateMyProfile]);
};

export default useDeviceLocation;
