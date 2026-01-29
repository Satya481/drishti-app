import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  Platform,
  ActivityIndicator,
  Modal,
  NativeModules,
  PermissionsAndroid,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import BottomNavigation from '../components/BottomNavigation';
import colors from '../theme/colors';

const { HardwareButtonModule } = NativeModules;

interface SOSScreenProps {
  navigation?: any;
}

export default function SOSScreen({ navigation }: SOSScreenProps) {
  const [primaryContact, setPrimaryContact] = useState('');
  const [secondaryContact, setSecondaryContact] = useState('');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  // Hardcoded AI call number for voice activation
  const aiCallNumber = '8177970238';
  const [isAiCallLoading, setIsAiCallLoading] = useState(false);
  const [showAiCallPopup, setShowAiCallPopup] = useState(false);
  
  // Voice activation states
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceRecognizedText, setVoiceRecognizedText] = useState('');
  const [showVoiceIndicator, setShowVoiceIndicator] = useState(false);
  const [isBackgroundServiceActive, setIsBackgroundServiceActive] = useState(false);
  const [voiceTimeout, setVoiceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Request microphone permission
  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'SafeRaasta needs access to your microphone for voice activation',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Start background voice activation service
  const startBackgroundVoiceService = () => {
    if (!HardwareButtonModule) {
      console.warn('HardwareButtonModule not available');
      return;
    }

    try {
      HardwareButtonModule.startVoiceActivationService((error: any, result: any) => {
        if (error) {
          console.error('Error starting voice service:', error);
          Alert.alert('Service Error', 'Failed to start background voice activation');
        } else {
          console.log('Voice service result:', result);
          setIsBackgroundServiceActive(true);
          Alert.alert(
            'Voice Activation Ready',
            'Press Volume Up 3 times, then Volume Down 3 times, then say "Drishtri help me" to activate emergency call.',
            [{ text: 'OK' }]
          );

          // Listen for button combo
          HardwareButtonModule.listenForButtonPress((action: any) => {
            if (action === 'button_combo_detected') {
              console.log('Button combo detected! Starting voice recognition...');
              startVoiceRecognition();
            }
          });
        }
      });
    } catch (e) {
      console.error('Error calling native module:', e);
    }
  };

  // Stop background voice service
  const stopBackgroundVoiceService = () => {
    if (!HardwareButtonModule) return;

    try {
      HardwareButtonModule.stopListeningForButtonPress();
      HardwareButtonModule.stopVoiceActivationService((error: any, result: any) => {
        if (!error) {
          setIsBackgroundServiceActive(false);
          console.log('Voice service stopped');
        }
      });
    } catch (e) {
      console.error('Error stopping voice service:', e);
    }
  };

  // Voice recognition handlers
  const onSpeechResults = (e: any) => {
    const text = e.value[0]?.toLowerCase() || '';
    setVoiceRecognizedText(text);
    console.log('Recognized speech:', text);

    // Check for wake phrase - flexible matching for "drishtri/drishti help me"
    const containsDrishti = text.includes('drishti') || text.includes('drishtri') || text.includes('drishty');
    const containsHelp = text.includes('help');
    
    if (containsDrishti && containsHelp) {
      console.log('✅ Wake phrase detected! Initiating emergency call...');
      setShowVoiceIndicator(false);
      stopVoiceRecognition();
      
      // Automatically trigger AI call with hardcoded number
      setTimeout(() => {
        initiateAiPoliceCall();
      }, 500);
    } else {
      console.log('⏸️ Speech recognized but wake phrase not matched. Listening again...');
      // Restart listening for next attempt
      setTimeout(() => {
        startVoiceRecognition();
      }, 1000);
    }
  };

  const onSpeechError = (e: any) => {
    // Ignore error code 5 (client-side error after successful recognition)
    const errorCode = e.error?.code;
    if (errorCode === '5') {
      console.log('⚠️ Minor recognition error (code 5) - resuming...');
      // Don't stop listening, just restart
      setTimeout(() => {
        startVoiceRecognition();
      }, 1000);
    } else {
      console.error('❌ Speech recognition error:', e);
      setShowVoiceIndicator(false);
      setIsVoiceActive(false);
    }
  };

  const startVoiceRecognition = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Microphone permission is required for voice activation',
        [{ text: 'OK' }]
      );
      return;
    }

    // Hardcoded number is always available, no validation needed
    try {
      console.log('🎤 Setting up voice recognition handlers...');
      
      // Ensure event handlers are set up before starting
      Voice.onSpeechStart = (e: any) => {
        console.log('🎙️ Speech has started');
      };
      
      Voice.onSpeechRecognized = (e: any) => {
        console.log('🎵 Speech recognized');
      };
      
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      
      Voice.onSpeechPartialResults = (e: any) => {
        const partialText = e.value[0];
        console.log('📝 Partial result:', partialText);
      };
      
      setIsVoiceActive(true);
      setShowVoiceIndicator(true);
      await Voice.start('en-US');
      console.log('✅ Voice recognition started - 8 second timeout active');
      console.log('🎯 Say: "Drishtri help me" to activate emergency call');
      
      // Set 8-second timeout to automatically stop microphone
      const timeout = setTimeout(() => {
        console.log('⏱️ 8-second timeout reached - stopping microphone');
        stopVoiceRecognition();
        setShowVoiceIndicator(false);
      }, 8000);
      
      setVoiceTimeout(timeout);
    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
      setIsVoiceActive(false);
      setShowVoiceIndicator(false);
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      // Clear the timeout if it exists
      if (voiceTimeout) {
        clearTimeout(voiceTimeout);
        setVoiceTimeout(null);
      }
      
      await Voice.stop();
      setIsVoiceActive(false);
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Hardware button detection (Power + Volume Up) + Setup background service
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Start background service on mount
    const initializeVoiceService = async () => {
      const hasPermission = await requestMicrophonePermission();
      if (hasPermission) {
        startBackgroundVoiceService();
      }
    };

    initializeVoiceService();

    return () => {
      // Clear voice timeout on unmount
      if (voiceTimeout) {
        clearTimeout(voiceTimeout);
      }
      Voice.destroy().then(Voice.removeAllListeners);
      stopBackgroundVoiceService();
    };
  }, []);

  const handleSaveContacts = () => {
    if (!primaryContact.trim()) {
      Alert.alert('Required', 'Please enter at least one emergency contact number');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(primaryContact.replace(/[\s\-\(\)]/g, ''))) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    Alert.alert(
      'Success',
      'Emergency contacts saved successfully!',
      [{ text: 'OK' }]
    );

    // TODO: Save to AsyncStorage or backend
    console.log('Saved contacts:', { primaryContact, secondaryContact, emergencyMessage });
  };

  const handleEmergencyCall = (number: string) => {
    if (!number) {
      Alert.alert('No Contact', 'Please save an emergency contact first');
      return;
    }

    const phoneUrl = Platform.OS === 'android' 
      ? `tel:${number}` 
      : `telprompt:${number}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Unable to make phone call');
        }
      })
      .catch((err) => console.error('Error making call:', err));
  };

  const validatePhoneNumber = (number: string) => {
    const regex = /^\d{10}$/;
    return regex.test(number);
  };

  const initiateAiPoliceCall = async () => {
    if (!validatePhoneNumber(aiCallNumber)) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit phone number.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAiCallLoading(true);
    setShowAiCallPopup(true);

    try {
      const response = await fetch('https://us.api.bland.ai/v1/calls', {
        method: 'POST',
        headers: {
          Authorization: 'org_839c36a87427de950bd9f9bd9c1bf3d75845947e9e6569a10046a4975695748faefd89be766c789bbc0c69',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: `+91${aiCallNumber}`,
          voice: 'Brady',
          wait_for_greeting: 'false',
          record: 'true',
          amd: 'false',
          answered_by_enabled: 'false',
          noise_cancellation: 'false',
          interruption_threshold: '100',
          block_interruptions: 'false',
          max_duration: '12',
          model: 'base',
          language: 'en',
          background_track: 'none',
          endpoint: 'https://api.bland.ai',
          voicemail_action: 'hangup',
          task: 'You are a highly trained emergency response assistant and first line of defense police agent. Your role is to provide immediate guidance and support to victims in emergency situations. You must remain calm, professional, and empathetic while providing clear, actionable instructions. Your primary objectives are: 1) Assess the immediate danger and ensure the victim\'s safety, 2) Guide them on what actions to take RIGHT NOW, 3) Provide step-by-step instructions for self-defense if needed, 4) Help them stay calm and focused, 5) Advise on whether to call local police (100), hide, escape, or defend themselves, 6) Provide real-time safety protocols based on the type of emergency (robbery, assault, accident, medical emergency, natural disaster, etc.). You must be concise, direct, and prioritize the victim\'s immediate safety above all else. Ask quick questions to understand the situation and provide immediate actionable guidance.',
        }),
      });

      const data = await response.json();
      console.log('AI Police Call Response:', data);

      if (!data.success) {
        setShowAiCallPopup(false);
        Alert.alert(
          'Call Failed',
          data.message || 'Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initiating AI call:', error);
      setShowAiCallPopup(false);
      Alert.alert(
        'Connection Error',
        'Unable to connect to emergency AI service. Please call 100 directly for immediate help.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAiCallLoading(false);
    }
  };

  const closeAiCallPopup = () => {
    setShowAiCallPopup(false);
  };

  const handleQuickSOS = () => {
    // Directly initiate AI Police call
    initiateAiPoliceCall();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.risk.high} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency SOS Button */}
        <View style={styles.sosCard}>
          <View style={styles.sosIconContainer}>
            <Text style={styles.sosIcon}>🚨</Text>
          </View>
          <Text style={styles.sosTitle}>Quick Emergency SOS</Text>
          <Text style={styles.sosDescription}>
            Press and hold to activate emergency alert
          </Text>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleQuickSOS}
            onLongPress={handleQuickSOS}
            activeOpacity={0.8}
          >
            <Text style={styles.sosButtonText}>ACTIVATE SOS</Text>
          </TouchableOpacity>
        </View>

        {/* AI Police Assistant Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🤖</Text>
            <Text style={styles.sectionTitle}>AI Police Assistant</Text>
          </View>

          <View style={styles.aiCard}>
            {/* Voice Activation Indicator */}
            {showVoiceIndicator && (
              <View style={styles.voiceIndicator}>
                <View style={styles.voiceWaveContainer}>
                  <ActivityIndicator color={colors.white} size="large" />
                </View>
                <Text style={styles.voiceIndicatorTitle}>🎤 Listening...</Text>
                <Text style={styles.voiceIndicatorText}>
                  Say "Drishtri help me" to activate emergency call
                </Text>
                {voiceRecognizedText && (
                  <Text style={styles.recognizedText}>
                    Heard: "{voiceRecognizedText}"
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.stopVoiceButton}
                  onPress={stopVoiceRecognition}
                >
                  <Text style={styles.stopVoiceText}>Stop Listening</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.aiInfoBanner}>
              <Text style={styles.aiInfoIcon}>🛡️</Text>
              <Text style={styles.aiInfoText}>
                Get immediate guidance from our AI police agent. First line of defense assistance.
              </Text>
            </View>

            {/* Phone number input - COMMENTED OUT (using hardcoded number 8177970238) */}
            {/* 
            <Text style={styles.label}>Your Phone Number</Text>
            <View style={styles.phoneInputWrapper}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <InputField
                placeholder="Enter 10-digit number"
                value={aiCallNumber}
                onChangeText={setAiCallNumber}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>

            <PrimaryButton
              title={isAiCallLoading ? "Connecting..." : "Get AI Police Assistance"}
              onPress={initiateAiPoliceCall}
              variant="success"
              loading={isAiCallLoading}
              disabled={isAiCallLoading}
            />
            */}

            {/* Auto-call with hardcoded number */}
            <View style={styles.hardcodedNumberBox}>
              <Text style={styles.hardcodedNumberLabel}>📞 Emergency Call Number</Text>
              <Text style={styles.hardcodedNumber}>+91 {aiCallNumber}</Text>
              <Text style={styles.hardcodedNumberDesc}>
                Press Volume Up 3x then Volume Down 3x and say "Drishtri help me" to call
              </Text>
            </View>

            {/* Voice Activation Instructions */}
            <View style={styles.voiceActivationBox}>
              <Text style={styles.voiceActivationTitle}>🎙️ Voice Activation - 3+3 Button Combo</Text>
              <Text style={styles.voiceActivationText}>
                Press <Text style={styles.boldText}>Volume Up 3 times</Text> then{' '}
                <Text style={styles.boldText}>Volume Down 3 times</Text>, then say{' '}
                <Text style={styles.boldText}>"Drishtri help me"</Text> to auto-call
              </Text>

              {/* Service Status Indicator */}
              <View style={[styles.statusIndicator, isBackgroundServiceActive ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusDot}>●</Text>
                <Text style={styles.statusText}>
                  {isBackgroundServiceActive ? '🟢 Voice Service Active' : '🔴 Voice Service Inactive'}
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.testVoiceButton, isBackgroundServiceActive && styles.testVoiceButtonActive]}
                onPress={() => {
                  if (isBackgroundServiceActive) {
                    stopBackgroundVoiceService();
                  } else {
                    startBackgroundVoiceService();
                  }
                }}
              >
                <Text style={styles.testVoiceText}>
                  {isBackgroundServiceActive ? '✓ Service Running' : '▶ Start Voice Service'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.testVoiceButton}
                onPress={startVoiceRecognition}
                disabled={isVoiceActive}
              >
                <Text style={styles.testVoiceText}>
                  {isVoiceActive ? '🎤 Listening...' : '🎤 Test Voice Activation'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.aiFeatures}>
              <View style={styles.aiFeatureItem}>
                <Text style={styles.aiFeatureIcon}>✓</Text>
                <Text style={styles.aiFeatureText}>Real-time safety guidance</Text>
              </View>
              <View style={styles.aiFeatureItem}>
                <Text style={styles.aiFeatureIcon}>✓</Text>
                <Text style={styles.aiFeatureText}>Immediate action steps</Text>
              </View>
              <View style={styles.aiFeatureItem}>
                <Text style={styles.aiFeatureIcon}>✓</Text>
                <Text style={styles.aiFeatureText}>Professional emergency support</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📞</Text>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>

          <View style={styles.card}>
            {/* Primary Contact */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Contact *</Text>
              <InputField
                placeholder="Enter phone number"
                value={primaryContact}
                onChangeText={setPrimaryContact}
                keyboardType="phone-pad"
              />

              {primaryContact && (
                <TouchableOpacity 
                  style={styles.quickCallButton}
                  onPress={() => handleEmergencyCall(primaryContact)}
                >
                  <Text style={styles.quickCallText}>Quick Call 📞</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Secondary Contact */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Secondary Contact (Optional)</Text>
              <InputField
                placeholder="Enter phone number"
                value={secondaryContact}
                onChangeText={setSecondaryContact}
                keyboardType="phone-pad"
              />

              {secondaryContact && (
                <TouchableOpacity 
                  style={styles.quickCallButton}
                  onPress={() => handleEmergencyCall(secondaryContact)}
                >
                  <Text style={styles.quickCallText}>Quick Call 📞</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Message Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💬</Text>
            <Text style={styles.sectionTitle}>Emergency Message</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Custom Message (Optional)</Text>
              <InputField
                placeholder="E.g., I need help! This is an emergency."
                value={emergencyMessage}
                onChangeText={setEmergencyMessage}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helpText}>
                This message will be sent along with your location during SOS
              </Text>
            </View>
          </View>
        </View>

        {/* Important Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🚔</Text>
            <Text style={styles.sectionTitle}>Emergency Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity 
              style={[styles.serviceCard, styles.servicePolice]}
              onPress={() => handleEmergencyCall('100')}
            >
              <Text style={styles.serviceIcon}>🚓</Text>
              <Text style={styles.serviceName}>Police</Text>
              <Text style={styles.serviceNumber}>100</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.serviceCard, styles.serviceAmbulance]}
              onPress={() => handleEmergencyCall('108')}
            >
              <Text style={styles.serviceIcon}>🚑</Text>
              <Text style={styles.serviceName}>Ambulance</Text>
              <Text style={styles.serviceNumber}>108</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.serviceCard, styles.serviceFire]}
              onPress={() => handleEmergencyCall('101')}
            >
              <Text style={styles.serviceIcon}>🚒</Text>
              <Text style={styles.serviceName}>Fire</Text>
              <Text style={styles.serviceNumber}>101</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.serviceCard, styles.serviceWomen]}
              onPress={() => handleEmergencyCall('1091')}
            >
              <Text style={styles.serviceIcon}>👮‍♀️</Text>
              <Text style={styles.serviceName}>Women</Text>
              <Text style={styles.serviceNumber}>1091</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <PrimaryButton
            title="Save Emergency Contacts"
            onPress={handleSaveContacts}
            variant="success"
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen="SOS"
        onNavigate={(screen) => navigation?.navigate(screen)}
      />

      {/* AI Call Confirmation Modal */}
      <Modal
        visible={showAiCallPopup}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalIcon}>🚔</Text>
              </View>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>AI Police Agent Calling</Text>
              <Text style={styles.modalMessage}>
                You will receive a call shortly. Our AI police assistant will guide you through the emergency situation and provide immediate safety instructions.
              </Text>

              <View style={styles.callStatusContainer}>
                <ActivityIndicator color={colors.primary} size="small" style={styles.statusSpinner} />
                <Text style={styles.callStatusText}>Connecting to AI agent...</Text>
              </View>

              <View style={styles.modalInfoBox}>
                <Text style={styles.modalInfoIcon}>ℹ️</Text>
                <Text style={styles.modalInfoText}>
                  Stay calm. The AI will assess your situation and provide step-by-step guidance.
                </Text>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={closeAiCallPopup}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.risk.high,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  sosCard: {
    backgroundColor: colors.risk.high,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.risk.high,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sosIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosIcon: {
    fontSize: 40,
  },
  sosTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sosDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  sosButton: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sosButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.risk.high,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
    marginTop: 0,
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  input: {
    marginBottom: 4,
  },
  textArea: {
    minHeight: 80,
  },
  helpText: {
    fontSize: 13,
    color: colors.text.light,
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  quickCallButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  quickCallText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  servicePolice: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  serviceAmbulance: {
    borderLeftWidth: 4,
    borderLeftColor: colors.risk.high,
  },
  serviceFire: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  serviceWomen: {
    borderLeftWidth: 4,
    borderLeftColor: '#EC4899',
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  serviceNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  saveButtonContainer: {
    marginTop: 8,
  },
  // AI Police Assistant Styles
  aiCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  aiInfoBanner: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiInfoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  aiInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  countryCodeBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  phoneInput: {
    flex: 1,
  },
  aiFeatures: {
    marginTop: 16,
    gap: 12,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiFeatureIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  aiFeatureText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    backgroundColor: colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  callStatusContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusSpinner: {
    marginRight: 12,
  },
  callStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  modalInfoBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalInfoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  // Voice Activation Styles
  voiceIndicator: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  voiceWaveContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceIndicatorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  voiceIndicatorText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  recognizedText: {
    fontSize: 14,
    color: colors.white,
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  stopVoiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  stopVoiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  voiceActivationBox: {
    backgroundColor: colors.primary + '08',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  voiceActivationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  voiceActivationText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '800',
    color: colors.primary,
  },
  testVoiceButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  testVoiceButtonActive: {
    backgroundColor: '#10B981',
  },
  testVoiceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    marginTop: 12,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusDot: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hardcodedNumberBox: {
    backgroundColor: colors.risk.safeBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.risk.safe,
    alignItems: 'center',
  },
  hardcodedNumberLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.risk.safe,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  hardcodedNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.risk.safe,
    marginBottom: 12,
    letterSpacing: 1,
  },
  hardcodedNumberDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
