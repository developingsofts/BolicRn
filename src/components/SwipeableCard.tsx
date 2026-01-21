import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { COLORS, DIMENSIONS } from "../config/constants";
import RatingStars from "./RatingStars";
import FontWeight from "../hooks/useInterFonts";
import STRINGS from "../config/strings";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

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
  isFirst?: boolean;
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
  isFirst = false,
  navigation,
  isFollowing = false,
  onFollow,
  onUnfollow,
  followLoading = false,
}) => {
  console.log("SwipeableCard partner:", partner);
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const [isAnimating, setIsAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isTrainer = "specialty" in partner || "hourlyRate" in partner;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;

      // Check if it's more of a horizontal swipe than vertical
      if (
        Math.abs(translationX) > Math.abs(translationY) &&
        Math.abs(translationX) > SWIPE_THRESHOLD
      ) {
        // Swipe threshold met for horizontal swipe
        const direction = translationX > 0 ? "right" : "left";
        animateSwipe(direction);
      } else {
        // Return to center
        resetPosition();
      }
    }
  };

  const animateSwipe = (direction: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);

    const targetX =
      direction === "right" ? screenWidth * 1.5 : -screenWidth * 1.5;
    const targetRotation = direction === "right" ? 30 : -30;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: targetRotation,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call the appropriate callback
      if (direction === "right") {
        onSwipeRight(partner);
      } else {
        onSwipeLeft(partner);
      }

      // Reset for next card
      resetPosition();
      setIsAnimating(false);
    });
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-10deg", "0deg", "10deg"],
  });

  const likeOpacity = translateX.interpolate({
    inputRange: [0, screenWidth * 0.25],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const nopeOpacity = translateX.interpolate({
    inputRange: [-screenWidth * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleStateChange}
      enabled={!isAnimating}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { translateX },
              { scale },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onPress && onPress(partner)}
          activeOpacity={0.9}
        >
          {/* Background Image */}
          <View style={styles.imageContainer}>
            {partner.imageUrl && !imageError ? (
              <Image
                source={{ uri: partner.imageUrl }}
                style={styles.profileImage}
                onError={() => {
                  console.log(
                    "Image load error for",
                    partner.name,
                    partner.imageUrl,
                  );
                  setImageError(true);
                }}
                onLoad={() =>
                  console.log(
                    "Image loaded for",
                    partner.name,
                    partner.imageUrl,
                  )
                }
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {(partner?.name?.charAt(0) || "?").toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <View style={styles.cardInfoContent}>
              {/* Name and Age */}
              <View style={styles.nameAgeContainer}>
                <Text style={styles.name}>{partner.name || "Unknown"}</Text>
                {partner.age && <Text style={styles.age}>{partner.age}</Text>}
              </View>

              {/* Location */}
              <View style={styles.locationContainer}>
                {partner.location && (
                  <Text style={styles.location}>{partner.location}</Text>
                )}
                {/* {partner.distance && <Text style={styles.distance}>{partner.distance}</Text>} */}
              </View>

              {/* Training Types */}
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

              {/* Rating Stars */}
              {/* <View style={styles.ratingSection}>
                <View style={styles.ratingStarsRow}>
                  <RatingStars 
                    rating={partner.rating || 0} 
                    size="small" 
                    readonly={true}
                    showRating={false}
                  />
                  <Text style={styles.ratingText}>
                    {partner.rating ? partner.rating.toFixed(1) : '0.0'} ({partner.totalRatings || 0} Reviews)
                  </Text>
                </View>
              </View> */}

              {/* Tags/Badges */}
              <View style={styles.tagsContainer}>
                {/* Specialty/Type Badge */}
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

                {/* Match/Rate Badge */}
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

                {/* Experience Badge */}
                {partner.experience && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{partner.experience}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPress && onPress(partner);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineButtonText}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !isTrainer && isFollowing
                      ? { backgroundColor: "#E6E6E6" }
                      : {},
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();

                    if (isTrainer) {
                      navigation?.navigate?.("BookTrainer", {
                        trainerId: String(partner.id),
                        trainerName: partner.name,
                        trainerAddress: partner.location || "",
                      });
                      return;
                    }

                    if (followLoading) {
                      return;
                    }

                    if (isFollowing) {
                      onUnfollow && onUnfollow(partner);
                    } else {
                      onFollow && onFollow(partner);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={!isTrainer && followLoading}
                >
                  <Text
                    style={
                      isTrainer || !isFollowing
                        ? styles.primaryButtonText
                        : styles.outlineButtonText
                    }
                  >
                    {isTrainer
                      ? "Book Session"
                      : followLoading
                        ? "..."
                        : isFollowing
                          ? "Unfollow"
                          : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Skip Button */}
              {onSkip && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onSkip(partner);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>{STRINGS.FIND.skip}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Swipe Indicators */}
          <Animated.View
            style={[styles.likeIndicator, { opacity: likeOpacity }]}
          >
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>

          <Animated.View
            style={[styles.nopeIndicator, { opacity: nopeOpacity }]}
          >
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    width: screenWidth - 32, // Adjust for margins
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
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#9CA3AF",
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
    color: COLORS.gradient1,
    marginRight: 8,
  },
  age: {
    fontSize: 16,
    fontWeight: 400,
    fontFamily: FontWeight.Regular,
    color: COLORS._616888,
  },
  location: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FontWeight.Medium,
    color: COLORS._616888,
    marginBottom: 6,
  },
  locationContainer: {
    marginBottom: 6,
  },
  distance: {
    fontSize: 12,
    color: COLORS._616888,
    fontWeight: "400",
  },
  bio: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 6,
  },
  trainingTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  trainingTypeTag: {
    backgroundColor: "#F3F4F6",
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
  fitnessLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fitnessLevelLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 4,
  },
  fitnessLevel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    textTransform: "capitalize",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  interestTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingStarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: COLORS._616888,
    fontWeight: "600",
    marginLeft: 8,
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
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
  },
  tagAccent: {
    backgroundColor: "#84FF8D",
  },
  tagTextAccent: {
    fontSize: 12,
    color: COLORS.app_black,
    fontFamily: FontWeight.SemiBold,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    alignItems: "center",
    shadowColor: "#767676",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  outlineButtonText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._383838,
  },
  blueButtonText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS.white,
  },
  safetyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  safetyLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 4,
  },
  safetyStars: {
    flexDirection: "row",
  },
  safetyStar: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  safetyStarFilled: {
    color: "#F59E0B",
  },
  likeIndicator: {
    position: "absolute",
    top: 50,
    right: 40,
    transform: [{ rotate: "15deg" }],
    borderWidth: 4,
    borderColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  likeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#10B981",
  },
  nopeIndicator: {
    position: "absolute",
    top: 50,
    left: 40,
    transform: [{ rotate: "-15deg" }],
    borderWidth: 4,
    borderColor: "#EF4444",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nopeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#EF4444",
  },
  skipButton: {
    alignSelf: "center",
    marginTop: 15,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
});

export default SwipeableCard;
