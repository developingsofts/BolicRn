import React from "react";
import { View, Text, StyleSheet, TouchableOpacity,Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import { useAuth } from "../contexts/AuthContext";
import FontWeight from "../hooks/useInterFonts";
import { ArrowDown } from "../../assets";

interface ChatScreenProps {
  navigation: any;
  route: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { partnerId, partnerName } = route.params || {};
  const { user } = useAuth();
  const initial = user?.displayName?.charAt(0);
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            gap: DIMENSIONS.spacing.md,
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderRadius: 100,
              height: 52,
              width: 52,
              borderColor: COLORS.white,
            }}
          >
            <View style={[styles.avatar]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.title}>{partnerName ? partnerName : "Chat"}</Text>
        </View>
        <Image source={ArrowDown} style={{
          width: 24, height: 24,
          tintColor: COLORS.white,
        }} />
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.white,
        }}
      >
  


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 18,
    color: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: DIMENSIONS.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: "center",
  },
  comingSoon: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.gradient3,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.primary,
    marginRight: DIMENSIONS.spacing.md,
  },

  messagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
});

export default ChatScreen;
