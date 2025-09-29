import React from 'react';
import { View, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { EyeHide } from '../../assets';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  style?: any;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder,
  isVisible,
  onToggleVisibility,
  style,
}) => {
  return (
    <View style={[styles.passwordContainer, style]}>
      <TextInput
        style={styles.passwordInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={onToggleVisibility}
      >
        {isVisible ? (
          <Ionicons name="eye" size={25} color={COLORS.app_black} />
        ) : (
          <Image
            resizeMode="contain"
            source={EyeHide}
            style={{ width: 25, height: 25 }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    backgroundColor: COLORS.background,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontFamily: FontWeight.Medium,
    paddingHorizontal: 12,
    color: COLORS.app_black,
    paddingVertical: 14,
    fontSize: 14,
  },
  eyeIcon: {
    paddingHorizontal: 9,
  },
});

export default PasswordInput;