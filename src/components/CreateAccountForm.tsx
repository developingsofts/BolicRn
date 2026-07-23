import React, { useState, useImperativeHandle } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { COLORS } from "../config/constants";

interface CreateAccountFormProps {
  onNext?: (data: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  onBack?: () => void;
  initialEmail?: string;
  initialPassword?: string;
  initialConfirmPassword?: string;
}

const CreateAccountForm = React.forwardRef<{
  submit: () => void;
}, CreateAccountFormProps>(({
  onNext,
  onBack,
  initialEmail = "",
  initialPassword = "",
  initialConfirmPassword = ""
}, ref) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialConfirmPassword);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      newErrors.email = "Invalid email address";
    else if (email.length > 255)
      newErrors.email = "Email must be less than 255 characters";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (password.length > 100)
      newErrors.password = "Password must be less than 100 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm your password";
    else if (confirmPassword !== password)
      newErrors.confirmPassword = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (validate()) {
      if (onNext) {
        onNext({ email, password, confirmPassword });
      }
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.formItem}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="youremail@example.com"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={COLORS._5E5E5E}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}
      </View>

      <View style={styles.formItem}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Minimum 8 characters"
          value={password}
          placeholderTextColor={COLORS._5E5E5E}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      </View>

      <View style={styles.formItem}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Re-enter your password"
          placeholderTextColor={COLORS._5E5E5E}
          value={confirmPassword}

          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        {errors.confirmPassword && (
          <Text style={styles.error}>{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );
});

CreateAccountForm.displayName = 'CreateAccountForm';

const styles = StyleSheet.create({
  form: { gap: 16,
    backgroundColor: COLORS.surface,
    padding:16,
    borderRadius:16,
    marginBottom:24
   },
  formItem: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: "500", color: COLORS.text, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  inputError: { borderColor: COLORS.error },
  error: { color: COLORS.error, fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: { flex: 1 },
  signIn: { alignItems: "center", marginTop: 24 },
  signInText: { fontSize: 14, color: COLORS.textSecondary },
  signInButton: {
    color: COLORS.primary,
    fontWeight: "400",
    textDecorationLine: "underline",
  },
});

export default CreateAccountForm;
