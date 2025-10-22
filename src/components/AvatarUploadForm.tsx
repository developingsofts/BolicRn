import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

interface AvatarUploadFormProps {
  onSubmit: (data: { avatar: string | null; name: string; description: string }) => void;
  initialName?: string;
  initialDescription?: string;
  initialAvatar?: string | null;
  loading?: boolean;
}

const AvatarUploadForm: React.FC<AvatarUploadFormProps> = ({
  onSubmit,
  initialName = "",
  initialDescription = "",
  initialAvatar = null,
  loading = false,
}) => {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [picking, setPicking] = useState(false);

  const pickImage = async () => {
    setPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access media library is required!");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({ avatar, name, description });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={picking || loading}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>+</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={picking || loading}>
        <Text style={styles.uploadBtnText}>{avatar ? "Change Photo" : "Upload Photo"}</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        editable={!loading}
        multiline
        numberOfLines={3}
      />
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? "Saving..." : "Continue"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 8,
    elevation: 4,
  },
  avatarWrapper: {
    alignSelf: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f3f4f6",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: "#bbb",
    fontWeight: "bold",
  },
  uploadBtn: {
    alignSelf: "center",
    marginBottom: 18,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  uploadBtnText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 15,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#222",
    marginBottom: 14,
  },
  textArea: {
    height: 72,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AvatarUploadForm;
