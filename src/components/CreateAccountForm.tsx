import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Button, ProgressBar } from "react-native-paper";

interface CreateAccountFormProps {
  onNext?: (data: { email: string; password: string; confirmPassword: string }) => void;
  onBack?: () => void;
}

const CreateAccountForm: React.FC<CreateAccountFormProps> = ({ onNext, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = "Invalid email address";
    else if (email.length > 255) newErrors.email = "Email must be less than 255 characters";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (password.length > 100) newErrors.password = "Password must be less than 100 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm your password";
    else if (confirmPassword !== password) newErrors.confirmPassword = "Passwords don't match";
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.step}>Step 2 of 4</Text>
      </View>

      {/* Progress Bar */}
      <ProgressBar progress={0.5} style={styles.progress} color="#6366F1" />

      {/* Form */}
      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="youremail@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
        </View>

        {/* Password Field */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="minimum 8 char"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.password && <Text style={styles.error}>{errors.password}</Text>}
        </View>

        {/* Confirm Password Field */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword && styles.inputError]}
            placeholder="reenter your pass"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button mode="outlined" style={styles.actionBtn} onPress={onBack}>
            Back
          </Button>
          <Button mode="contained" style={styles.actionBtn} onPress={onSubmit}>
            Next
          </Button>
        </View>
      </View>

      {/* Sign In Link */}
      <View style={styles.signIn}>
        <Text style={styles.signInText}>
          Already have an account?{' '}
          <TouchableOpacity onPress={() => { /* handle sign in navigation */ }}>
            <Text style={styles.signInButton}>Sign In</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: 24, flex: 1, justifyContent: 'center' },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '600', color: '#222' },
  step: { fontSize: 14, color: '#888', marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 24 },
  form: { gap: 16 },
  formItem: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 6 },
  input: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1 },
  signIn: { alignItems: 'center', marginTop: 24 },
  signInText: { fontSize: 14, color: '#888' },
  signInButton: { color: '#6366F1', fontWeight: '400', textDecorationLine: 'underline' },
});

export default CreateAccountForm;
