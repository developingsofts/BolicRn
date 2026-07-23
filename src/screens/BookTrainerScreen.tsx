import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, DIMENSIONS } from "../config/constants";
import { LeftArrow } from "../../assets";
import FontWeight from "../hooks/useInterFonts";
import BasicTopBar from "../components/BasicTopBar";
import { useGetTrainingPricesQuery } from "../services/api/pricesApi";
import { useAuth } from "../contexts/AuthContext";

interface BookTrainerScreenProps {
  navigation: any;
  route?: {
    params?: {
      trainerId?: string;
      trainerName?: string;
      trainerAddress?: string;
    };
  };
}

interface SessionPackage {
  id: number | string;
  session_name: string;
  description: string;
  price: string | number;
}

const BookTrainerScreen: React.FC<BookTrainerScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const trainerName = route?.params?.trainerName || "Trainer";
  const trainerId = route?.params?.trainerId;
  const trainerAddress = route?.params?.trainerAddress || "";

  const {
    data: pricesData,
    isLoading: isPricesLoading,
    refetch,
  } = useGetTrainingPricesQuery(
    { trainerId: trainerId || "" },
    { skip: !trainerId }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const sessions =
    pricesData && pricesData.status && "data" in pricesData
      ? pricesData.data
      : [];

  const sessionPackages: SessionPackage[] = sessions.map((s: any) => ({
    id: s.id || s._id,
    session_name: s.session_name || s.title || "",
    description: s.description || "",
    price: s.price || 0,
  }));

  const handleBookSession = (
    priceId: string,
    packageName: string,
    price: string | number,
    description: string
  ) => {
    navigation.navigate("SelectDateTime", {
      trainerId,
      trainerName,
      priceId,
      packageName,
      price,
      description,
      trainerAddress,
    });
  };

  const renderPackageCard = (pkg: SessionPackage, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.packageCard}
      onPress={() =>
        handleBookSession(
          pkg.id.toString(),
          pkg.session_name,
          pkg.price,
          pkg.description
        )
      }
      activeOpacity={0.7}
    >
      <View style={styles.packageHeader}>
        <Text style={styles.packageTitle}>{pkg.session_name}</Text>
      </View>
      <Text style={styles.packageDescription}>{pkg.description}</Text>
      <View style={styles.packagePricing}>
        <Text style={styles.packagePrice}>${pkg.price}/hr</Text>
      </View>
    </TouchableOpacity>
  );

  if (isPricesLoading) {
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
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (!sessionPackages || sessionPackages.length === 0) {
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
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>
            No packages available
          </Text>
        </View>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            title="Pull to refresh"
            titleColor={COLORS.textSecondary}
          />
        }
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
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: DIMENSIONS.spacing.md,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
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
