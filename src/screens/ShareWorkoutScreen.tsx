import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import { Ionicons } from "@expo/vector-icons";
import { Achievement, ImageFile, LeftArrow } from "../../assets";
import FontWeight from "../hooks/useInterFonts";

type Workout = {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  completedDate: string;
  time: string;
};

const mockWorkouts: Workout[] = [
  {
    id: "1",
    name: "Upper Body Power",
    type: "Strength",
    difficulty: "Medium",
    completedDate: "Yesterday",
    time: "45 mins",
  },
  {
    id: "2",
    name: "Morning Cardio",
    type: "Cardio",
    difficulty: "Easy",
    completedDate: "2 days ago",
    time: "30 mins",
  },
];

interface ShareWorkoutScreenProps {
  navigation: any;
}

const ShareWorkoutScreen: React.FC<ShareWorkoutScreenProps> = ({
  navigation,
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [postText, setPostText] = useState("");

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Top Bar */}
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
        }}
      >
        <View style={styles.topBar}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Image source={LeftArrow} style={{ width: 24, height: 24 }} />
            </TouchableOpacity>
            <Text style={styles.heading}>Share Workout</Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: COLORS.white,
              marginTop: 8,
              fontFamily: FontWeight.Medium,
            }}
          >
            Share your workout or achievement
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {mockWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={[
                styles.workoutCard,
                selectedWorkout?.id === workout.id &&
                  styles.selectedWorkoutCard,
              ]}
              onPress={() => setSelectedWorkout(workout)}
            >
              <Text style={styles.workoutName}>{workout.name}</Text>
              <View style={styles.workoutDetailsRow}>
                <View
                  style={{
                    backgroundColor: "rgba(11, 128, 255, 0.1)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={styles.workoutType}>{workout.type}</Text>
                </View>
                <Text style={styles.workoutDetail}>{workout.time}</Text>
                <Text style={styles.workoutDetail}>{workout.difficulty}</Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "400",
                  color: "#5E5E5E",
                  fontFamily: FontWeight.Regular,
                }}
              >
                Completed: {workout.completedDate}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Post Area */}
          <View
            style={{
              boxShadow: "0px 0px 8px 0px rgba(107, 107, 107, 0.15)",
              padding: 20,
              borderRadius: 10,

              backgroundColor: COLORS.white,
            }}
          >
            <TextInput
              numberOfLines={6}
              style={styles.textArea}
              multiline
              placeholderTextColor="#999"
              placeholder="what's on your mind?"
              value={postText}
              onChangeText={setPostText}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={ImageFile} style={{ width: 22, height: 22 }} />
                <Text style={styles.actionBtnText}>Photo/Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Image source={Achievement} style={{ width: 22, height: 22 }} />
                <Text style={styles.actionBtnText}>Achievement</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.postBtn}>
              <Text style={styles.postBtnText}>Post</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  topBar: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.md,
    paddingBottom: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.gradient3,
  },
  backBtn: {
    padding: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: 600,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
  scrollContent: {
    padding: DIMENSIONS.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: COLORS.primary,
  },
  workoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    boxShadow: "0px 0px 8px 0px rgba(107, 107, 107, 0.15)",
    borderColor: COLORS._E6E6E7,
  },
  selectedWorkoutCard: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  workoutInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  workoutType: {
    fontSize: 12,
    color: "rgba(11, 128, 255, 1)",
    fontWeight: "400",
    fontFamily: FontWeight.Medium,
  },
  workoutDetailsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 6,
  },
  workoutDetail: {
    fontSize: 12,
    color: "#151515",
    fontFamily: FontWeight.Medium,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 18,
    marginBottom: 6,
    color: COLORS.app_black,
  },
  textArea: {
    minHeight: 130,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    backgroundColor: COLORS.white,
    textAlignVertical: "top",
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "space-between",
    marginVertical: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
  },
  actionBtnText: {
    marginLeft: 6,
    color: COLORS.black,
    fontWeight: "500",
    fontSize: 14,
  },
  postBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 14,
  },
  postBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
});

export default ShareWorkoutScreen;
