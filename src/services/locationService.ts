let watchId: number | null = null;
let currentLat = 0;
let currentLng = 0;

export const locationService = {
  isTracking: () => watchId !== null,

  startTracking: async (mrId: number, onLocationUpdate?: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      console.warn('[Location] Geolocation not supported');
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (permission.state === 'denied') {
        console.warn('[Location] Permission denied');
        return false;
      }
    } catch { /* some browsers don't support permissions API */ }

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;

        // Determine activity type
        let activityType = 'idle';
        if (speed > 5) activityType = 'travel';
        else if (speed <= 5 && currentLat !== 0) activityType = 'visit';

        try {
          await fetch('/api/mr-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mr_id: mrId, lat: currentLat, lng: currentLng, activity_type: activityType, speed })
          });
        } catch (err) {
          console.warn('[Location] Failed to post location:', err);
        }

        if (onLocationUpdate) onLocationUpdate(currentLat, currentLng);
      },
      (error) => {
        console.error('[Location] Error:', error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    console.log('[Location] Tracking started for MR', mrId);
    return true;
  },

  stopTracking: () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      console.log('[Location] Tracking stopped');
    }
  },

  getLastLocation: () => ({ lat: currentLat, lng: currentLng })
};
