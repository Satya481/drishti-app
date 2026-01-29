import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';

interface InputFieldProps {
  placeholder: string;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  maxLength?: number;
}

export default function InputField({ 
  placeholder, 
  icon, 
  secureTextEntry = false,
  value,
  onChangeText,
  keyboardType = 'default',
  style,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [borderAnim] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E5E5', '#3B82F6'],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        multiline && styles.multilineContainer,
        {
          borderColor: borderColor,
        },
        style
      ]}
    >
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      <TextInput
        style={[
          styles.input, 
          multiline && styles.multilineInput,
          !editable && styles.disabledInput
        ]}
        placeholder={placeholder}
        placeholderTextColor="#B0B0B0"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        maxLength={maxLength}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  multilineInput: {
    paddingVertical: 8,
    lineHeight: 20,
  },
  disabledInput: {
    color: '#999',
  },
});
