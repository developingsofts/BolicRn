import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { COLORS } from '../config/constants';
import RatingStars from './RatingStars';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

export interface TrainingPartner {
  id: number;
  name: string;
  age: number;
  type: string;
  distance: string;
  compatibility: number;
  bio?: string;
  location?: string;
  experience?: string;
  rating?: number;
  totalRatings?: number;
}

export interface Trainer {
  id: number;
  name: string;
  age: number;
  specialty: string;
  distance: string;
  rating: number;
  hourlyRate: string;
  bio?: string;
  location?: string;
  experience?: string;
  certifications: string[];
  totalRatings?: number;
}

export type SwipeableItem = TrainingPartner | Trainer;

interface SwipeableCardProps {
  partner: SwipeableItem;
  onSwipeLeft: (partner: SwipeableItem) => void;
  onSwipeRight: (partner: SwipeableItem) => void;
  onPress?: (partner: SwipeableItem) => void;
  isFirst?: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  partner,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isFirst = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const [isAnimating, setIsAnimating] = useState(false);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        // Swipe threshold met
        const direction = translationX > 0 ? 'right' : 'left';
        animateSwipe(direction);
      } else {
        // Return to center
        resetPosition();
      }
    }
  };

  const animateSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);

    const targetX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;
    const targetRotation = direction === 'right' ? 30 : -30;

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
      if (direction === 'right') {
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
      Animated.spring(translateY, {
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
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const likeOpacity = translateX.interpolate({
    inputRange: [0, screenWidth * 0.25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = translateX.interpolate({
    inputRange: [-screenWidth * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
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
              { translateY },
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
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {partner.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Card Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameAgeContainer}>
              <Text style={styles.name}>{partner.name}</Text>
              <Text style={styles.age}>{partner.age}</Text>
            </View>
            
            <Text style={styles.location}>{partner.location || 'Location not set'}</Text>
            
            <Text style={styles.bio} numberOfLines={3}>
              {partner.bio || 'No bio available'}
            </Text>

            {/* Training Type/Specialty */}
            <View style={styles.fitnessLevelContainer}>
              <Text style={styles.fitnessLevelLabel}>
                {'specialty' in partner ? 'Specialty:' : 'Training Type:'}
              </Text>
              <Text style={styles.fitnessLevel}>
                {'specialty' in partner ? partner.specialty : partner.type}
              </Text>
            </View>

            {/* Distance and Compatibility/Rating */}
            <View style={styles.interestsContainer}>
              <View style={styles.interestTag}>
                <Text style={styles.interestText}>{partner.distance}</Text>
              </View>
              <View style={styles.interestTag}>
                <Text style={styles.interestText}>
                  {'compatibility' in partner 
                    ? `${partner.compatibility}% Match` 
                    : `${partner.hourlyRate}`
                  }
                </Text>
              </View>
              {partner.experience && (
                <View style={styles.interestTag}>
                  <Text style={styles.interestText}>{partner.experience}</Text>
                </View>
              )}
            </View>

            {/* Rating Display */}
            <View style={styles.ratingContainer}>
              <RatingStars 
                rating={partner.rating || 0} 
                size="small" 
                readonly={true}
                showRating={true}
              />
              {partner.totalRatings && (
                <Text style={styles.totalRatingsText}>
                  ({partner.totalRatings} reviews)
                </Text>
              )}
            </View>
          </View>

          {/* Swipe Indicators */}
          <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          
          <Animated.View style={[styles.nopeIndicator, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: screenWidth - 40,
    height: screenWidth * 1.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: '60%',
    width: '100%',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  cardInfo: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  nameAgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginRight: 8,
  },
  age: {
    fontSize: 20,
    color: '#6B7280',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  fitnessLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fitnessLevelLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  fitnessLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRatingsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  safetyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  safetyStars: {
    flexDirection: 'row',
  },
  safetyStar: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  safetyStarFilled: {
    color: '#F59E0B',
  },
  likeIndicator: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '15deg' }],
    borderWidth: 4,
    borderColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  likeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
  },
  nopeIndicator: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 4,
    borderColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nopeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});

export default SwipeableCard;
