import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { RNGeolocationCoordinates } from '../types'; // Using our defined type

interface GeolocationState {
  loading: boolean;
  coordinates: RNGeolocationCoordinates | null;
  error: string | null;
}

const useGeolocation = (): GeolocationState => {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    coordinates: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      setState(prevState => ({ ...prevState, loading: true, error: null }));
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setState({
              loading: false,
              coordinates: null,
              error: 'Permission to access location was denied. Please enable it in settings.',
            });
          }
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setState({
            loading: false,
            coordinates: location.coords as RNGeolocationCoordinates, // Now compatible
            error: null,
          });
        }
      } catch (err: any) {
        console.error("Error getting location:", err);
        if (isMounted) {
          setState({
            loading: false,
            coordinates: null,
            error: err.message || 'Failed to get location. Ensure location services are enabled.',
          });
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

export default useGeolocation;
