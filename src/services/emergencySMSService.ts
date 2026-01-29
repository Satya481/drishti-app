import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import RNGeolocation from 'react-native-geolocation-service';
import { FAST2SMS } from '../config/keys';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  error?: string;
}

/**
 * Get device's current location
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
  return new Promise((resolve) => {
    try {
      RNGeolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('📍 Location obtained:', { latitude, longitude, accuracy });
          resolve({
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
          });
        },
        (error) => {
          console.error('❌ Location error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (e) {
      console.error('Error getting location:', e);
      resolve(null);
    }
  });
};

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === 
          PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.ACCESS_COARSE_LOCATION'] === 
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Send SMS via Fast2SMS API
 */
export const sendEmergencySMS = async (
  phoneNumber: string,
  location?: LocationCoordinates | null,
  customMessage?: string
): Promise<boolean> => {
  try {
    if (!phoneNumber) {
      console.error('❌ Phone number is required');
      return false;
    }

    // Format phone number to 10 digits (remove country code if present)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (formattedNumber.length > 10) {
      formattedNumber = formattedNumber.slice(-10);
    }

    // Construct message with location
    let message = 'EMERGENCY: I need help! ';
    
    if (customMessage) {
      message += customMessage + ' ';
    }

    if (location) {
      const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      message += `My location: ${googleMapsUrl}`;
    } else {
      message += 'Location: Unable to determine current location';
    }

    console.log('📤 Sending SMS to:', formattedNumber);
    console.log('📨 Message:', message);

    // Fast2SMS API endpoint (bulkV2 supports JSON body)
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: FAST2SMS,
      },
      body: JSON.stringify({
        route: 'q',
        numbers: formattedNumber,
        message,
      }),
    });

    const rawText = await response.text();
    if (!rawText) {
      console.error('❌ Fast2SMS response was empty', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ Fast2SMS response parse error:', parseError, rawText);
      return false;
    }

    console.log('📬 Fast2SMS Response:', data);

    if (data.return === true) {
      console.log('✅ SMS sent successfully');
      return true;
    }

    console.error('❌ SMS sending failed:', data);
    return false;
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
};

/**
 * Make emergency call and send SMS
 */
export const initiateEmergencyCallWithSMS = async (
  phoneNumber: string,
  location?: LocationCoordinates | null,
  customMessage?: string
): Promise<void> => {
  try {
    // Send SMS
    console.log('🚨 Initiating emergency call and SMS...');
    const smsSent = await sendEmergencySMS(phoneNumber, location, customMessage);

    if (smsSent) {
      console.log('✅ SMS sent and initiating call');
    } else {
      console.log('⚠️ SMS failed but attempting call anyway');
    }

    // Make call
    const phoneUrl = Platform.OS === 'android'
      ? `tel:${phoneNumber}`
      : `telprompt:${phoneNumber}`;

    const supported = await Linking.canOpenURL(phoneUrl);
    if (supported) {
      await Linking.openURL(phoneUrl);
    }
  } catch (error) {
    console.error('❌ Error in emergency sequence:', error);
  }
};

/**
 * Get location URL for sharing
 */
export const getLocationShareURL = (location: LocationCoordinates): string => {
  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
};
