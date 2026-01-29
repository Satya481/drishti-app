import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

// Slide data with different taglines and background images
const SLIDES = [
  {
    id: 1,
    backgroundImage: require('../../assets/images/landing_bg_1.png'),
    buttonOffset: 0,
    dotsOffset: 0,
  },
  {
    id: 2,
    backgroundImage: require('../../assets/images/landing_bg_2.png'),
    buttonOffset: -20,
    dotsOffset: -10,
  },
  {
    id: 3,
    backgroundImage: require('../../assets/images/landing_bg_3.png'),
    buttonOffset: -30,
    dotsOffset: -15,
  },
];


export default function LandingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Auto-slide effect with enhanced animation
  useEffect(() => {
    // Initial button animation
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    const timer = setInterval(() => {
      // Fade and slide out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change slide
        setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
        
        // Reset position
        slideAnim.setValue(width);
        
        // Fade and slide in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [fadeAnim, slideAnim, buttonScaleAnim]);

  const handleCheckRouteSafety = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Map');
    }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Animated Background Image */}
      <Animated.View style={[
        styles.backgroundContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}>
        <ImageBackground
          source={currentSlide.backgroundImage}
          style={styles.background}
          resizeMode="cover"
        >
          {/* Gradient Overlay for better text visibility */}
          <View style={styles.gradientOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* Static Content Overlay */}
      <View style={styles.contentContainer}>
        {/* Middle Section - Illustration Space (handled by background) */}
        <View style={styles.middleSection} />

        {/* Bottom Section - Button and Pagination */}
        <Animated.View 
          style={[
            styles.bottomSection,
            { transform: [{ scale: buttonScaleAnim }] }
          ]}
        >
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Navigate Safer</Text>
            <Text style={styles.ctaSubtitle}>AI-powered route safety analysis</Text>
            
            <PrimaryButton
              title="Check Route Safety"
              onPress={handleCheckRouteSafety}
              style={styles.ctaButton}
            />
          </View>

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {SLIDES.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  background: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  middleSection: {
    flex: 1,
  },
  bottomSection: {
    position: 'absolute',
    bottom: height * 0.08,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ctaCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  ctaButton: {
    width: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 6,
    transition: 'all 0.3s ease',
  },
  activeDot: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
