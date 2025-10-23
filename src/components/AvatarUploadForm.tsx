import React, { useState, useImperativeHandle } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface AvatarUploadFormProps {
  onDataChange?: (data: {
    avatar: string | null;
    name: string;
    description: string;
  }) => void;
  initialName?: string;
  initialDescription?: string;
  initialAvatar?: string | null;
  loading?: boolean;
}

const AvatarUploadForm = React.forwardRef<
  {
    submit: () => void;
    getData: () => { avatar: string | null; name: string; description: string };
  },
  AvatarUploadFormProps
>(
  (
    {
      onDataChange,
      initialName = "",
      initialDescription = "",
      initialAvatar = null,
      loading = false,
    },
    ref
  ) => {
    const [avatar, setAvatar] = useState<string | null>(initialAvatar);
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [picking, setPicking] = useState(false);

    const pickImage = async () => {
      setPicking(true);
      try {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
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

    useImperativeHandle(ref, () => ({
      submit: handleSubmit,
      getData: () => ({ avatar, name, description }),
    }));

    const handleSubmit = () => {
      if (onDataChange) {
        onDataChange({ avatar, name, description });
      }
    };

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={pickImage}
          disabled={picking || loading}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={pickImage}
          disabled={picking || loading}
        >
          <Text style={styles.uploadBtnText}>
            {avatar ? "Change Photo" : "Upload Photo"}
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            marginBottom: 8,
            fontWeight: "500",
            fontSize: 16,
            color: "#444",
          }}
        >
          Your Name
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <Text
          style={{
            marginBottom: 8,
            fontWeight: "500",
            fontSize: 16,
            color: "#444",
          }}
        >
          Description
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Something about yourself..."
          value={description}
          onChangeText={setDescription}
          editable={!loading}
          multiline
          numberOfLines={3}
        />
      </View>
    );
  }
);

AvatarUploadForm.displayName = "AvatarUploadForm";

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
    justifyContent: "center",
    marginBottom: 18,
    flexDirection: "row",
    borderWidth: 1,
    flex: 1,
    width: "80%",
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  uploadBtnText: {
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
