import React, { useState } from "react";
import { Alert, Image } from "react-native";
import { useCreateTrainingPriceMutation } from "../services/api/pricesApi";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Ionicons } from "@expo/vector-icons";
import { Add } from "../../assets";

interface TrainerSetupStep1Props {
  onNext: () => void;
}

const TrainerSetupStep1: React.FC<TrainerSetupStep1Props> = ({ onNext }) => {
  const [sessions, setSessions] = useState([
    {
      id: Date.now().toString(),
      name: "",
      description: "",
      price: "",
    },
  ]);
  const [createTrainingPrice, { isLoading }] = useCreateTrainingPriceMutation();

  const handleAddSession = () => {
    const newSession = {
      id: Date.now().toString(),
      name: "",
      description: "",
      price: "",
    };
    setSessions([...sessions, newSession]);
  };

  const updateSession = (id: string, field: string, value: string) => {
    setSessions(
      sessions.map((session) =>
        session.id === id ? { ...session, [field]: value } : session
      )
    );
  };

  const removeSession = (id: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((session) => session.id !== id));
    }
  };

  // Handler for Next: validate and call API
  const handleNextStep = async () => {
    // Validate sessions
    const validSessions = sessions.filter(
      (s) =>
        s.name.trim() &&
        s.description.trim() &&
        s.price &&
        !isNaN(Number(s.price))
    );
    if (validSessions.length === 0) {
      Alert.alert(
        "Please add at least one valid session with name, description, and price."
      );
      return;
    }
    try {
      await createTrainingPrice(
        validSessions.map((s) => ({
          session_name: s.name,
          description: s.description,
          price: s.price.toString(),
        }))
      ).unwrap();
      onNext();
    } catch (e: any) {
      Alert.alert(
        "Failed to create sessions",
        e?.data?.message || "Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} keyboardVerticalOffset={80}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={styles.addSessionBtn}
          onPress={handleAddSession}
        >
          <Text style={styles.addSessionText}>Add New Session</Text>
          <Image
            source={Add}
            tintColor={COLORS._191919}
            style={{
              width: 12,
              height: 12,
              marginLeft: 5,
            }}
          />
        </TouchableOpacity>
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Set Your Rates</Text>
          <Text style={styles.sectionDesc}>
            Create packages for clients to book. You can add more later.
          </Text>
        </View>
        {sessions.map((session, index) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              {/* <Text style={styles.sessionTitle}>Session {index + 1}</Text> */}
              {sessions.length > 1 && index !== 0 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeSession(session.id)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Session name</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.name}
                onChangeText={(text) => updateSession(session.id, "name", text)}
                placeholder="Session name"
                placeholderTextColor={COLORS._5E5E5E}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.description}
                onChangeText={(text) =>
                  updateSession(session.id, "description", text)
                }
                placeholder="Description"
                placeholderTextColor={COLORS._5E5E5E}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per hour</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.price}
                onChangeText={(text) =>
                  updateSession(session.id, "price", text)
                }
                placeholder="$ per hour"
                placeholderTextColor={COLORS._5E5E5E}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <Text style={styles.nextBtnText}>
            {isLoading ? "Saving..." : "Next"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  addSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 0,
    boxShadow: "0px 0px 12px 0px #76767626",
    marginBottom: 24,
    gap: 8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
  },
  addSessionText: {
    color: COLORS._383838,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    marginTop: 5,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  removeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: COLORS.gradient1,
    marginBottom: 2,
    fontFamily: FontWeight.Medium,
  },
  inputField: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignContent: "center",
    minHeight: 36,
    fontFamily: FontWeight.Medium,
    fontSize:14,
    color: COLORS.app_black,
    justifyContent: "center",
  },
  inputText: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FontWeight.Medium,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
});

export default TrainerSetupStep1;
