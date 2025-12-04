import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { VideoIcon } from "../../assets";

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
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedLabel =
    YEARS.find((y) => y.value === workExperience)?.label || "Select";

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
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownButtonText}>{selectedLabel}</Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {showDropdown && (
          <ScrollView
            style={styles.dropdownList}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            {YEARS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                onPress={() => {
                  setWorkExperience(item.value);
                  setShowDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    workExperience === item.value &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {workExperience === item.value && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Intro Video Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Intro Video</Text>
        {videoPreview ? (
          <View style={styles.videoHeaderContainer}>
            <TouchableOpacity
              style={styles.videoHeaderRow}
              onPress={handleVideoUpload}
            >
              <View style={styles.videoHeaderLeft}>
                <Text style={styles.changeVideoText}>Change Video</Text>
                <Image
                  source={VideoIcon}
                  style={{ width: 20, height: 20, marginLeft: 8 }}
                  resizeMode={ResizeMode.CONTAIN}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setVideoPreview(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleVideoUpload}
          >
            <Text style={styles.uploadBtnText}>
              Add Intro/Promotional Video
            </Text>
            <Image
              source={VideoIcon}
              style={{ width: 20, height: 20, marginLeft: 8 }}
              resizeMode={ResizeMode.CONTAIN}
            />
          </TouchableOpacity>
        )}
        {videoPreview ? (
          <View style={styles.videoPreviewBox}>
            <Video
              key={videoPreview}
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
    marginTop: 5,
    marginBottom: 24,
    borderRadius: 8,
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    elevation: 4,
  },
  heading: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 18,
    textAlign: "left",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.app_black,
    marginBottom: 8,
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    maxHeight: 250,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  dropdownItemTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  pickerWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
    position: "relative",
  },
  dropdownIndicator: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -10,
    pointerEvents: "none",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  videoHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  videoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  videoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changeVideoText: {
    color: COLORS._383838,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  removeText: {
    color: "#ef4444",
    fontFamily: FontWeight.SemiBold,
    fontSize: 14,
  },
  uploadBtnText: {
    color: COLORS._383838,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
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
