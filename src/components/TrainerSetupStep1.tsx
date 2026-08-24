import React from "react";
import { Image } from "react-native";
import { useCreateTrainingPriceMutation } from "../services/api/pricesApi";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Add } from "../../assets";
import { Toast } from "./ToastManager";

/**
 * LOCAL COPY — this belongs in `src/config/strings.ts`
 * (e.g. `STRINGS.TRAINER_SETUP.step1`). It lives here only because strings.ts
 * is being edited concurrently. TODO: move into STRINGS and import from there.
 */
const STEP1_COPY = {
  addSession: "Add New Session",
  title: "Set Your Rates",
  description: "Create packages for clients to book. You can add more later.",
  remove: "Remove",
  sessionName: "Session name",
  descriptionLabel: "Description",
  pricePerHour: "Price per hour",
  pricePlaceholder: "$ per hour",
  next: "Next",
  saving: "Saving...",
  needOneSession:
    "Add at least one session with a name, description and price before continuing.",
  createFailed: "Failed to create sessions. Please try again.",
};

export interface SessionDraft {
  id: string;
  name: string;
  description: string;
  price: string;
  /** true once this draft has been persisted, so Next never creates it twice. */
  saved?: boolean;
}

export const createEmptySession = (): SessionDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  description: "",
  price: "",
});

const isValidSession = (session: SessionDraft) =>
  !!session.name.trim() &&
  !!session.description.trim() &&
  !!session.price &&
  !isNaN(Number(session.price));

interface TrainerSetupStep1Props {
  onNext: () => void;
  /** Owned by TrainerSetup so stepping back from step 2 preserves the entries. */
  sessions: SessionDraft[];
  setSessions: React.Dispatch<React.SetStateAction<SessionDraft[]>>;
}

const TrainerSetupStep1: React.FC<TrainerSetupStep1Props> = ({
  onNext,
  sessions,
  setSessions,
}) => {
  const [createTrainingPrice, { isLoading }] = useCreateTrainingPriceMutation();

  const handleAddSession = () => {
    setSessions((prev) => [...prev, createEmptySession()]);
  };

  const updateSession = (
    id: string,
    field: "name" | "description" | "price",
    value: string
  ) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id
          ? { ...session, [field]: value, saved: false }
          : session
      )
    );
  };

  const removeSession = (id: string) => {
    setSessions((prev) =>
      prev.length > 1 ? prev.filter((session) => session.id !== id) : prev
    );
  };

  const handleNextStep = async () => {
    const validSessions = sessions.filter(isValidSession);
    if (validSessions.length === 0) {
      Toast.warning(STEP1_COPY.needOneSession);
      return;
    }

    // Only send drafts that have not been persisted yet, so coming back from
    // step 2 and pressing Next again does not duplicate the trainer's packages.
    const pending = validSessions.filter((session) => !session.saved);
    if (pending.length === 0) {
      onNext();
      return;
    }

    try {
      await createTrainingPrice(
        pending.map((session) => ({
          session_name: session.name,
          description: session.description,
          price: session.price.toString(),
        }))
      ).unwrap();
      const pendingIds = new Set(pending.map((session) => session.id));
      setSessions((prev) =>
        prev.map((session) =>
          pendingIds.has(session.id) ? { ...session, saved: true } : session
        )
      );
      onNext();
    } catch (e: any) {
      Toast.error(e?.data?.message || STEP1_COPY.createFailed);
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
          <Text style={styles.addSessionText}>{STEP1_COPY.addSession}</Text>
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
          <Text style={styles.sectionTitle}>{STEP1_COPY.title}</Text>
          <Text style={styles.sectionDesc}>{STEP1_COPY.description}</Text>
        </View>
        {sessions.map((session, index) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              {sessions.length > 1 && index !== 0 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeSession(session.id)}
                >
                  <Text style={styles.removeBtnText}>{STEP1_COPY.remove}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STEP1_COPY.sessionName}</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.name}
                onChangeText={(text) => updateSession(session.id, "name", text)}
                placeholder={STEP1_COPY.sessionName}
                placeholderTextColor={COLORS._5E5E5E}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STEP1_COPY.descriptionLabel}</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.description}
                onChangeText={(text) =>
                  updateSession(session.id, "description", text)
                }
                placeholder={STEP1_COPY.descriptionLabel}
                placeholderTextColor={COLORS._5E5E5E}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{STEP1_COPY.pricePerHour}</Text>
              <TextInput
                style={[styles.inputField, { height: 48 }]}
                value={session.price}
                onChangeText={(text) =>
                  updateSession(session.id, "price", text)
                }
                placeholder={STEP1_COPY.pricePlaceholder}
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
            {isLoading ? STEP1_COPY.saving : STEP1_COPY.next}
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.black,
    fontSize: 12,
    fontFamily: FontWeight.Medium,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: FontWeight.Medium,
  },
  inputField: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignContent: "center",
    minHeight: 36,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
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
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FontWeight.Medium,
  },
});

export default TrainerSetupStep1;
