import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import STRINGS from "../config/strings";
import { r } from "../designing/responsiveDesigns";

const { width: screenWidth } = Dimensions.get("window");

export interface TrainingPartner {
  id: number;
  name: string;
  age: number;
  type: string;
  trainingTypes?: string[];
  distance: string;
  compatibility: number;
  bio?: string;
  location?: string;
  experience?: string;
  rating?: number;
  totalRatings?: number;
  imageUrl?: string;
}

export interface Trainer {
  id: number;
  name: string;
  age: number;
  specialty: string;
  trainingTypes?: string[];
  distance: string;
  rating: number;
  hourlyRate: string;
  bio?: string;
  location?: string;
  experience?: string;
  certifications: string[];
  totalRatings?: number;
  imageUrl?: string;
}

export type SwipeableItem = TrainingPartner | Trainer;

interface SwipeableCardProps {
  partner: SwipeableItem;
  onSwipeLeft: (partner: SwipeableItem) => void;
  onSwipeRight: (partner: SwipeableItem) => void;
  onPress?: (partner: SwipeableItem) => void;
  onSkip?: (partner: SwipeableItem) => void;
  navigation?: any;
  isFollowing?: boolean;
  onFollow?: (partner: SwipeableItem) => void;
  onUnfollow?: (partner: SwipeableItem) => void;
  followLoading?: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  partner,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  onSkip,
  navigation,
  isFollowing = false,
  onFollow,
  onUnfollow,
  followLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const isTrainer = "specialty" in partner || "hourlyRate" in partner;

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isDismissing = useRef(false);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const dismissCard = (
    direction: "left" | "right" | "none",
    onDone: (partner: SwipeableItem) => void,
  ) => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    const animations = [
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ];
    if (direction !== "none") {
      animations.push(
        Animated.timing(translateX, {
          toValue: direction === "right" ? screenWidth : -screenWidth,
          duration: 260,
          useNativeDriver: true,
        }),
      );
    }
    Animated.parallel(animations).start(() => onDone(partner));
  };

  return (
    <Animated.View
      style={[styles.card, { opacity, transform: [{ translateX }] }]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onPress && onPress(partner)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {partner.imageUrl && !imageError ? (
            <Image
              source={{ uri: partner.imageUrl }}
              style={styles.profileImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {(partner?.name?.charAt(0) || "?").toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.cardInfoContent}>
            <View style={styles.nameAgeContainer}>
              <Text style={styles.name}>{partner.name || "Unknown"}</Text>
              {partner.age && <Text style={styles.age}>{partner.age}</Text>}
            </View>

            <View style={styles.locationContainer}>
              {partner.location && (
                <Text style={styles.location}>{partner.location}</Text>
              )}
            </View>

            {partner.trainingTypes && partner.trainingTypes.length > 0 && (
              <View style={styles.trainingTypesContainer}>
                {partner.trainingTypes
                  .slice(0, 3)
                  .map((trainingType, index) => (
                    <View key={index} style={styles.trainingTypeTag}>
                      <Text style={styles.trainingTypeText}>
                        {trainingType}
                      </Text>
                    </View>
                  ))}
                {partner.trainingTypes.length > 3 && (
                  <Text style={styles.moreTypesText}>
                    +{partner.trainingTypes.length - 3} more
                  </Text>
                )}
              </View>
            )}

            <View style={styles.tagsContainer}>
              {(("specialty" in partner && partner.specialty) ||
                ("type" in partner && partner.type)) && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {"specialty" in partner
                      ? partner.specialty
                      : "type" in partner
                        ? partner.type
                        : ""}
                  </Text>
                </View>
              )}

              <View style={[styles.tag, styles.tagAccent]}>
                <Text style={styles.tagTextAccent}>
                  {"compatibility" in partner &&
                  partner.compatibility !== undefined
                    ? `${partner.compatibility}% Match`
                    : "hourlyRate" in partner
                      ? partner.hourlyRate || "Contact for rates"
                      : "Contact for rates"}
                </Text>
              </View>

              {partner.experience && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{partner.experience}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  onPress && onPress(partner);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineBtnText}>View Profile</Text>
              </TouchableOpacity>

              {isTrainer ? (
                <TouchableOpacity
                  style={styles.filledBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation?.navigate?.("BookTrainer", {
                      trainerId: String(partner.id),
                      trainerName: partner.name,
                      trainerAddress: partner.location || "",
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.black}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.filledBtnText}>Book</Text>
                </TouchableOpacity>
              ) : isFollowing ? (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (followLoading) return;
                    onUnfollow && onUnfollow(partner);
                  }}
                  activeOpacity={0.8}
                  disabled={followLoading}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={COLORS.text}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.outlineBtnText}>
                    {followLoading ? "..." : "Following"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.filledBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (followLoading) return;
                    onFollow && onFollow(partner);
                  }}
                  activeOpacity={0.8}
                  disabled={followLoading}
                >
                  <Text style={styles.filledBtnText}>
                    {followLoading ? "..." : "Follow"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  dismissCard("left", onSwipeLeft);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineBtnText}>Pass</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filledBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  dismissCard("right", onSwipeRight);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filledBtnText}>{STRINGS.FIND.connect}</Text>
              </TouchableOpacity>
            </View>

            {onSkip && (
              <TouchableOpacity
                style={styles.skipProfileBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  dismissCard("none", onSkip);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.skipProfileText}>{STRINGS.FIND.skip}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: screenWidth - 32,
  },
  cardContent: {
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    height: 224,
    width: "100%",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 16,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  cardInfo: {
    padding: 24,
  },
  cardInfoContent: {},
  nameAgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginRight: 8,
  },
  age: {
    fontSize: 16,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  location: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    marginBottom: 6,
  },
  locationContainer: {
    marginBottom: 6,
  },
  trainingTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  trainingTypeTag: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trainingTypeText: {
    fontSize: 12,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
  },
  moreTypesText: {
    fontSize: 11,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Medium,
    alignSelf: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.black,
    fontFamily: FontWeight.SemiBold,
  },
  tagAccent: {
    backgroundColor: COLORS.success,
  },
  tagTextAccent: {
    fontSize: 12,
    color: COLORS.black,
    fontFamily: FontWeight.SemiBold,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionIcon: {
    marginRight: 8,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    height: r(41, 'height'),
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  filledBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: r(38, 'height'),
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  filledBtnText: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  skipProfileBtn: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipProfileText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
});

export default SwipeableCard;
