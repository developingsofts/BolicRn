import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';

interface RatingStarsProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  showRating?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 'medium',
  onRatingChange,
  readonly = false,
  showRating = true,
}) => {
  const stars = [1, 2, 3, 4, 5];
  
  const getStarSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getStarColor = (starNumber: number) => {
    return starNumber <= rating ? '#FFD700' : COLORS.border;
  };

  const handleStarPress = (starNumber: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starNumber);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <TouchableOpacity
            key={star}
            style={[
              styles.starButton,
              { width: getStarSize(), height: getStarSize() }
            ]}
            onPress={() => handleStarPress(star)}
            disabled={readonly}
          >
            <Text style={[
              styles.star,
              { 
                fontSize: getStarSize(),
                color: getStarColor(star)
              }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showRating && (
        <Text style={[
          styles.ratingText,
          { fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14 }
        ]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontWeight: 'bold',
  },
  ratingText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

export default RatingStars;
