export function getCurrentCoordinates(options = {}) {
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const isSecure =
    typeof window !== "undefined" ? window.isSecureContext : true;

  if (!isSecure && !isLocalhost) {
    return Promise.reject(
      new Error("Location requires HTTPS (or localhost in development)")
    );
  }

  const fastMode = options.fastMode ?? false;
  const targetAccuracyMeters = options.targetAccuracyMeters ?? (fastMode ? 80 : 10);
  const maxAttempts = options.maxAttempts ?? (fastMode ? 1 : 3);

  const getOnce = (geoOptions) =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported in this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message = "Unable to fetch current location";
          if (error?.code === 1) message = "Location permission denied";
          if (error?.code === 2) message = "Location unavailable";
          if (error?.code === 3) message = "Location request timed out";
          reject(new Error(message));
        },
        geoOptions
      );
    });

  const highAccuracyOptions = {
    enableHighAccuracy: true,
    timeout: fastMode ? 7000 : 20000,
    maximumAge: 0,
    ...options,
  };

  const coarseOptions = {
    enableHighAccuracy: false,
    timeout: fastMode ? 4000 : 12000,
    maximumAge: fastMode ? 300000 : 120000,
    ...options,
  };

  return (async () => {
    // Speed-first path: coarse first for near-instant response.
    if (fastMode) {
      try {
        const coarse = await getOnce(coarseOptions);
        return coarse;
      } catch {
        // fall through to normal attempts
      }
    }

    let best = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const current = await getOnce(highAccuracyOptions);
        if (!best || current.accuracy < best.accuracy) {
          best = current;
        }
        if (current.accuracy <= targetAccuracyMeters) {
          return current;
        }
      } catch (error) {
        if (!best) {
          throw error;
        }
      }
    }

    // Final fallback: try coarse location once.
    try {
      const coarse = await getOnce(coarseOptions);
      if (!best || coarse.accuracy < best.accuracy) {
        best = coarse;
      }
    } catch {
      // Ignore here; handled by best check below.
    }

    if (best) {
      return best;
    }
    throw new Error("Unable to fetch current location");
  })();
}
