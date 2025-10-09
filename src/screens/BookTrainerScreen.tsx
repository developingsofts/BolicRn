import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../config/constants";
import { LeftArrow } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import BasicTopBar from "../components/BasicTopBar";

interface BookTrainerScreenProps {
  navigation: any;
  route?: {
    params?: {
      trainerId?: string;
      trainerName?: string;
    };
  };
}

interface SessionPackage {
  title: string;
  description: string;
  price: number;
  sessions?: number;
  savings?: string;
}

const sessionPackages: SessionPackage[] = [
  {
    title: "Single Session",
    description: "One-on-one personalized training session.",
    price: 75,
  },
  {
    title: "5 - Session Pack",
    description: "Save 10% with a bundle of 5 sessions.",
    price: 337,
    sessions: 5,
    savings: "10%",
  },
  {
    title: "10 - Session Pack",
    description: "Best value with maximum savings.",
    price: 600,
    sessions: 10,
    savings: "20%",
  },
];

const BookTrainerScreen: React.FC<BookTrainerScreenProps> = ({
  navigation,
  route,
}) => {
  const trainerName = route?.params?.trainerName || "Alex";
  const trainerId = route?.params?.trainerId;

  const handleBookSession = (packageTitle: string, price: number) => {
    navigation.navigate("SelectDateTime", {
      trainerId,
      trainerName,
      packageTitle,
      price,
    });
  };

  const renderPackageCard = (pkg: SessionPackage, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.packageCard}
      onPress={() => handleBookSession(pkg.title, pkg.price)}
      activeOpacity={0.7}
    >
      <View style={styles.packageHeader}>
        <Text style={styles.packageTitle}>{pkg.title}</Text>
        {/* {pkg.savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save {pkg.savings}</Text>
          </View>
        )} */}
      </View>
      <Text style={styles.packageDescription}>{pkg.description}</Text>
      <View style={styles.packagePricing}>
        <Text style={styles.packagePrice}>${pkg.price}</Text>
        {/* {pkg.sessions && (
          <Text style={styles.packageSessions}>({pkg.sessions} sessions)</Text>
        )} */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BasicTopBar
        containerStyle={styles.topBar}
        onBackPress={() => navigation.goBack()}
        backButtonIcon={
          <Image
            source={LeftArrow}
            style={styles.backIcon}
            resizeMode="contain"
          />
        }
        title="Book a Session"
        subtitle={`with ${trainerName}`}
        titleStyle={styles.topBarTitle}
        subtitleStyle={styles.topBarSubtitle}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.packagesContainer}>
          {sessionPackages.map((pkg, index) => renderPackageCard(pkg, index))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingTop: DIMENSIONS.spacing.xxl,
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  backIcon: {
    width: 28,
    height: 28,
    tintColor: COLORS.white,
  },
  topBarTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 24,
    color: COLORS.white,
  },
  topBarSubtitle: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.xxl,
  },
  packagesContainer: {
    marginTop: DIMENSIONS.spacing.lg,
    gap: DIMENSIONS.spacing.md,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.sm,
    boxShadow: "0px 0px 8px 0px #6B6B6B26",
    elevation: 4,
    borderWidth: 1,
    gap: DIMENSIONS.spacing.sm, 
    borderColor: COLORS.border,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packageTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.gradient1,
  },
  savingsBadge: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: DIMENSIONS.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    fontWeight: 400,
    color: COLORS._5E5E5E,
  },
  packageDescription: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    fontWeight: 400,
    color: COLORS._5E5E5E,
    // marginBottom: DIMENSIONS.spacing.md,
    lineHeight: 20,
  },
  packagePricing: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: DIMENSIONS.spacing.sm,
  },
  packagePrice: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 20,
    fontWeight: 600,
    color: COLORS._2E6BDD,
  },
  packageSessions: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    color: COLORS._5E5E5E,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    color: COLORS.app_black,
    marginBottom: DIMENSIONS.spacing.md,
  },
  featuresList: {
    gap: DIMENSIONS.spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  featureText: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    color: COLORS._5E5E5E,
    flex: 1,
  },
});

export default BookTrainerScreen;
