

import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import { Prayer, RNGeolocationCoordinates, PrayerTimes as ImportedPrayerTimes } from '../types';
import { BASE_PRAYERS, MOCK_PRAYER_TIMES as FALLBACK_MOCK_TIMES_OBJECT } from '../constants';

// Helper function to create a Date object from a "hh:mm A" string for mock data
const parseMockTime = (timeString: string): Date => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
    }
    if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};


// Helper to convert mock object to Prayer[] for fallback
const getMockPrayerArray = (): Prayer[] => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  // This mock array should align with BASE_PRAYERS structure if used directly
  return [
    { name: 'fajr', time: FALLBACK_MOCK_TIMES_OBJECT.fajr, arabicName: 'الفجر', date: dateStr, dateObject: parseMockTime(FALLBACK_MOCK_TIMES_OBJECT.fajr) },
    { name: 'sunrise', time: '06:00 AM', arabicName: 'الشروق', date: dateStr, dateObject: parseMockTime('06:00 AM') }, // Mock sunrise
    { name: 'dhuhr', time: FALLBACK_MOCK_TIMES_OBJECT.dhuhr, arabicName: 'الظهر', date: dateStr, dateObject: parseMockTime(FALLBACK_MOCK_TIMES_OBJECT.dhuhr) },
    { name: 'asr', time: FALLBACK_MOCK_TIMES_OBJECT.asr, arabicName: 'العصر', date: dateStr, dateObject: parseMockTime(FALLBACK_MOCK_TIMES_OBJECT.asr) },
    { name: 'maghrib', time: FALLBACK_MOCK_TIMES_OBJECT.maghrib, arabicName: 'المغرب', date: dateStr, dateObject: parseMockTime(FALLBACK_MOCK_TIMES_OBJECT.maghrib) },
    { name: 'isha', time: FALLBACK_MOCK_TIMES_OBJECT.isha, arabicName: 'العشاء', date: dateStr, dateObject: parseMockTime(FALLBACK_MOCK_TIMES_OBJECT.isha) },
  ];
};

export const getDeviceLocation = async (): Promise<RNGeolocationCoordinates | null> => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn("Permission to access location was denied.");
      return null;
    }
    let locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });
    return locationResult.coords;
};

// This function returns Prayer[] and is used by PrayerTimesScreen
export const calculateAndFormatPrayerTimes = async (coords: RNGeolocationCoordinates | null): Promise<{ prayers: Prayer[], date: string, isMock: boolean, error?: string }> => {
  const isMockData = !coords;
  // Use Mecca as a fallback if no coordinates are provided to get realistic-looking times
  const calculationCoords = coords || { latitude: 21.4225, longitude: 39.8262 };

  if (isMockData) {
    console.warn("Location not provided, using mock prayer times based on Mecca.");
  }

  try {
    const coordinates = new Coordinates(calculationCoords.latitude, calculationCoords.longitude);
    const date = new Date();
    const params = CalculationMethod.MuslimWorldLeague();
    const adhanPrayers = new AdhanPrayerTimes(coordinates, date, params);
    const timezone = moment.tz.guess();

    console.log('Adhan calculated times (UTC):', {
        fajr: adhanPrayers.fajr.toISOString(),
        sunrise: adhanPrayers.sunrise.toISOString(),
        dhuhr: adhanPrayers.dhuhr.toISOString(),
        asr: adhanPrayers.asr.toISOString(),
        maghrib: adhanPrayers.maghrib.toISOString(),
        isha: adhanPrayers.isha.toISOString(),
    });
    
    const formattedDate = date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prayerTimes: Prayer[] = BASE_PRAYERS.map(p => {
      let time: string;
      let dateObject: Date;
      switch (p.name) {
        case 'fajr':    dateObject = adhanPrayers.fajr; break;
        case 'sunrise': dateObject = adhanPrayers.sunrise; break;
        case 'dhuhr':   dateObject = adhanPrayers.dhuhr; break;
        case 'asr':     dateObject = adhanPrayers.asr; break;
        case 'maghrib': dateObject = adhanPrayers.maghrib; break;
        case 'isha':    dateObject = adhanPrayers.isha; break;
        default:        dateObject = new Date();
      }
      time = moment(dateObject).tz(timezone).format('hh:mm A');
      return { ...p, time, date: formattedDate, dateObject };
    });
    
    console.log('Formatted prayer times for timezone', timezone, prayerTimes.map(p => ({ name: p.name, time: p.time, dateObj: p.dateObject?.toLocaleString() })));
    return { 
        prayers: prayerTimes, 
        date: formattedDate, 
        isMock: isMockData, 
        error: isMockData ? "Location permission denied or failed. Displaying approximate times." : undefined 
    };

  } catch (error: any) {
    console.error('Error calculating prayer times with AdhanJS:', error);
    const mockPrayers = getMockPrayerArray();
    return { prayers: mockPrayers, date: mockPrayers[0].date || new Date().toLocaleDateString('ar-EG'), isMock: true, error: "Failed to calculate prayer times. Displaying approximate times." };
  }
};


// New function for HomeScreen, returns PrayerTimes object
export const getDeviceLocationAndPrayerTimesForHome = async (): Promise<{ prayerTimes: ImportedPrayerTimes | null, error: string | null }> => {
  let deviceCoords: RNGeolocationCoordinates | null = null;
  let locationError: string | null = null;

  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      // Try requesting again if not already granted (getDeviceLocation also does this)
      status = (await Location.requestForegroundPermissionsAsync()).status; 
    }

    if (status !== 'granted') {
      locationError = "Location permission not granted.";
    } else {
      deviceCoords = await getDeviceLocation(); // Re-use existing getDeviceLocation
      if (!deviceCoords) {
        locationError = "Failed to get device location.";
      }
    }
  } catch (e: any) {
    console.error("Error in getDeviceLocation (for Home):", e);
    locationError = e.message || "An error occurred while fetching location.";
  }

  // calculateAndFormatPrayerTimes returns { prayers: Prayer[], date: string, error?: string }
  const { prayers: prayerArray, date: prayerDate, error: calculationError } = await calculateAndFormatPrayerTimes(deviceCoords);

  let combinedError = locationError;
  if (calculationError) {
    if (combinedError) combinedError += ` ${calculationError}`; // Append calculation error
    else combinedError = calculationError;
  }

  if (!prayerArray || prayerArray.length === 0) {
    return { prayerTimes: FALLBACK_MOCK_TIMES_OBJECT, error: combinedError || "Failed to retrieve prayer times."};
  }
  
  // Convert Prayer[] to PrayerTimes object
  const prayerTimesObject: Partial<ImportedPrayerTimes> = { date: prayerDate || FALLBACK_MOCK_TIMES_OBJECT.date };
  prayerArray.forEach(p => {
    // Map 'fajr', 'dhuhr', etc. from Prayer[] to PrayerTimes object
    // Time is already HH:mm from calculateAndFormatPrayerTimes
    if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(p.name)) {
      (prayerTimesObject as any)[p.name] = p.time;
    }
  });

  // Ensure all fields are present for the PrayerTimes object type
  const finalPrayerTimesObject: ImportedPrayerTimes = {
    date: prayerTimesObject.date || FALLBACK_MOCK_TIMES_OBJECT.date,
    fajr: prayerTimesObject.fajr || FALLBACK_MOCK_TIMES_OBJECT.fajr,
    dhuhr: prayerTimesObject.dhuhr || FALLBACK_MOCK_TIMES_OBJECT.dhuhr,
    asr: prayerTimesObject.asr || FALLBACK_MOCK_TIMES_OBJECT.asr,
    maghrib: prayerTimesObject.maghrib || FALLBACK_MOCK_TIMES_OBJECT.maghrib,
    isha: prayerTimesObject.isha || FALLBACK_MOCK_TIMES_OBJECT.isha,
  };
  
  return { prayerTimes: finalPrayerTimesObject, error: combinedError };
};