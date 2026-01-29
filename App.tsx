import React, { useState, useEffect } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import LandingScreen from './src/screens/LandingScreen';
import MapScreen from './src/screens/MapScreen';
import SOSScreen from './src/screens/SOSScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Disable React DevTools to prevent Text rendering issues in RN 0.83
if (__DEV__) {
  // @ts-ignore
  if (typeof global !== 'undefined' && global.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    // @ts-ignore
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'ForgotPassword' | 'SignUp' | 'Landing' | 'Map' | 'SOS' | 'Profile'>('SOS');

  const navigation = {
    navigate: (screen: 'Login' | 'ForgotPassword' | 'SignUp' | 'Landing' | 'Map' | 'SOS' | 'Profile') => {
      setCurrentScreen(screen);
    },
    goBack: () => {
      setCurrentScreen('SOS');
    },
  };

  if (currentScreen === 'Profile') {
    return <ProfileScreen navigation={navigation} />;
  }

  if (currentScreen === 'SOS') {
    return <SOSScreen navigation={navigation} />;
  }

  if (currentScreen === 'Map') {
    return <MapScreen navigation={navigation} />;
  }

  if (currentScreen === 'Landing') {
    return <LandingScreen navigation={navigation} />;
  }

  if (currentScreen === 'ForgotPassword') {
    return <ForgotPasswordScreen navigation={navigation} />;
  }

  if (currentScreen === 'SignUp') {
    return <SignUpScreen navigation={navigation} />;
  }

  return <LoginScreen navigation={navigation} />;
}
