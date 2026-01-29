import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { loginWithEmail } from '../services/authService';
import colors from '../theme/colors';

// Icon components (using Unicode characters for simplicity)
const EmailIcon = () => (
  <Image
    source={require('../../assets/images/email.png')}
    style={styles.inputIcon}
  />
);

const LockIcon = () => (
  <Image
    source={require('../../assets/images/lock.png')}
    style={styles.inputIcon}
  />
);


const GoogleIcon = () => (
  <Image 
    source={{ uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
    style={{ width: 24, height: 24 }}
  />
);

interface LoginScreenProps {
  navigation?: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);
      console.log('Logged in user:', result.user);
      // Navigate to Landing screen after successful login
      if (navigation) {
        navigation.navigate('Landing');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In will be implemented soon!',
      [{ text: 'OK' }]
    );
  };

  const handleForgotPassword = () => {
    if (navigation) {
      navigation.navigate('ForgotPassword');
    }
  };

  const handleSignUp = () => {
    if (navigation) {
      navigation.navigate('SignUp');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/login_background.png')}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue</Text>
          </View>
          <InputField
            placeholder="Email Address"
            icon={<EmailIcon />}
            value={email}
            onChangeText={setEmail}
          />

          <InputField
            placeholder="Password"
            icon={<LockIcon />}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Log In"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={loading}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <GoogleIcon />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
{/* Divider */}
<View style={styles.authFooterDivider}>
  <View style={styles.divider} />
</View>

{/* Sign up text */}
         <View style={styles.cardFooter}>
  <Text style={styles.footerText}>
    Don&apos;t have an account?{' '}
    <Text style={styles.signUpText} onPress={handleSignUp}>
      Sign up
    </Text>
  </Text>
</View>
    </View>
</ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    transform: [
      { translateY: 10 },
      { scale: 1.08 },
    ],
  },
  inputIcon: {
    width: 26,
    height: 26,
    tintColor: colors.text.secondary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    elevation: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginTop: 220,
  },
  cardHeader: {
    marginBottom: 28,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: colors.text.light,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
    marginLeft: 12,
  },
  authFooterDivider: {
    marginTop: 28,
    marginBottom: 20,
  },
  cardFooter: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
