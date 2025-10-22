import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Video, ResizeMode } from "expo-av";

const YEARS = [
  { label: "1 Year", value: "1" },
  { label: "2 Years", value: "2" },
  { label: "3 Years", value: "3" },
  { label: "4 Years", value: "4" },
  { label: "5 Years", value: "5" },
  { label: "6 Years", value: "6" },
  { label: "7 Years", value: "7" },
  { label: "8 Years", value: "8" },
  { label: "9 Years", value: "9" },
  { label: "10+ Years", value: "10" },
];

const TrainerProfileDetails: React.FC = () => {
  const [workExperience, setWorkExperience] = useState("7");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const handleVideoUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your media library."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setVideoPreview(asset.uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trainer Profile Details</Text>

      {/* Work Experience Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Work Experience</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={workExperience}
            onValueChange={(itemValue) => setWorkExperience(itemValue)}
            style={{ width: "100%" }}
            itemStyle={{ fontSize: 16 }}
          >
            {YEARS.map((item) => (
              <Picker.Item
                key={item.value}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Intro Video Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Intro Video</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleVideoUpload}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color="#2563eb"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.uploadBtnText}>
              {videoPreview ? "Change Video" : "Add Intro/Promotional Video"}
            </Text>
          </TouchableOpacity>
          {videoPreview && (
            <TouchableOpacity
              style={styles.removeVideoBtn}
              onPress={() => setVideoPreview(null)}
            >
              <Text style={styles.removeVideoBtnText}>Remove Video</Text>
            </TouchableOpacity>
          )}
        </View>
        {videoPreview ? (
          <View style={styles.videoPreviewBox}>
            <Video
              key={videoPreview} // Add this line
              source={{ uri: videoPreview }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
            />
          </View>
        ) : (
          <View style={styles.videoPreviewBoxEmpty}>
            <Text style={styles.videoEmptyText}>No video uploaded</Text>
          </View>
        )}
      </View>
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
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
    marginBottom: 18,
    textAlign: "left",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: "#222",
    marginBottom: 8,
    fontWeight: "500",
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  uploadBtnText: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 15,
  },
  removeVideoBtn: {
    marginLeft: 12,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  removeVideoBtnText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 15,
  },
  videoPreviewBox: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPreviewBoxEmpty: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  videoEmptyText: {
    color: "#888",
    fontSize: 14,
  },
});

export default TrainerProfileDetails;
