import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Menu, Button, Chip } from 'react-native-paper';
import { COLORS, DIMENSIONS } from '../config/constants';
import SwipeableCard, { TrainingPartner, Trainer, SwipeableItem } from '../components/SwipeableCard';
import RatingStars from '../components/RatingStars';
import RatingModal from '../components/RatingModal';

interface FindScreenProps {
  navigation: any;
}

const FindScreen: React.FC<FindScreenProps> = ({ navigation }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['All']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'partners' | 'trainers'>('partners');
  const [menuVisible, setMenuVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedUserForRating, setSelectedUserForRating] = useState<{ name: string; type: 'partner' | 'trainer' } | null>(null);

  const trainingCategories = [
    'All',
    'Strength Training',
    'Cardio',
    'Yoga',
    'CrossFit',
    'HIIT',
    'Pilates',
    'Running',
    'Cycling',
    'Swimming',
    'Boxing',
    'Martial Arts',
    'Dance',
    'Nearby'
  ];

  const mockPartners: TrainingPartner[] = [
    {
      id: 1,
      name: 'Alex',
      age: 28,
      type: 'Strength Training',
      distance: '2.3km',
      compatibility: 95,
      location: 'Downtown Gym',
      experience: '3 years',
      bio: 'Passionate about powerlifting and helping others reach their fitness goals. Looking for a serious training partner!',
      rating: 4.8,
      totalRatings: 24
    },
    {
      id: 2,
      name: 'Sarah',
      age: 25,
      type: 'Cardio & HIIT',
      distance: '1.8km',
      compatibility: 87,
      location: 'Central Park',
      experience: '2 years',
      bio: 'Love running and high-intensity workouts. Always up for a challenge and pushing limits together!',
      rating: 4.6,
      totalRatings: 18
    },
    {
      id: 3,
      name: 'Mike',
      age: 30,
      type: 'CrossFit',
      distance: '3.1km',
      compatibility: 92,
      location: 'CrossFit Box',
      experience: '4 years',
      bio: 'CrossFit enthusiast looking for someone to tackle WODs with. Let\'s get stronger together!',
      rating: 4.9,
      totalRatings: 31
    },
    {
      id: 4,
      name: 'Emma',
      age: 27,
      type: 'Yoga & Pilates',
      distance: '1.2km',
      compatibility: 78,
      location: 'Yoga Studio',
      experience: '5 years',
      bio: 'Yoga instructor seeking a mindful training partner. Balance strength with flexibility!',
      rating: 4.7,
      totalRatings: 22
    },
    {
      id: 5,
      name: 'David',
      age: 32,
      type: 'Mixed Training',
      distance: '4.5km',
      compatibility: 89,
      location: 'Fitness Center',
      experience: '6 years',
      bio: 'Versatile trainer who enjoys mixing different styles. Let\'s create the perfect workout routine!',
      rating: 4.5,
      totalRatings: 15
    },
  ];

  const mockTrainers: Trainer[] = [
    {
      id: 101,
      name: 'Coach Maria',
      age: 35,
      specialty: 'Strength & Conditioning',
      distance: '1.5km',
      rating: 4.9,
      hourlyRate: '$75/hr',
      location: 'Elite Fitness Center',
      experience: '8 years',
      bio: 'Certified strength coach specializing in functional training and injury prevention. Let\'s build strength together!',
      certifications: ['NASM', 'ACE', 'CrossFit L2'],
      totalRatings: 47
    },
    {
      id: 102,
      name: 'Trainer James',
      age: 29,
      specialty: 'HIIT & Cardio',
      distance: '2.1km',
      rating: 4.7,
      hourlyRate: '$65/hr',
      location: 'Cardio Studio',
      experience: '5 years',
      bio: 'HIIT specialist who loves pushing limits and achieving results. Ready to transform your fitness journey!',
      certifications: ['ACE', 'HIIT Specialist'],
      totalRatings: 33
    },
    {
      id: 103,
      name: 'Yoga Master Lisa',
      age: 42,
      specialty: 'Yoga & Mindfulness',
      distance: '0.8km',
      rating: 4.8,
      hourlyRate: '$80/hr',
      location: 'Zen Yoga Studio',
      experience: '12 years',
      bio: 'Experienced yoga instructor focusing on mindfulness, flexibility, and stress relief. Find your inner peace.',
      certifications: ['RYT-500', 'Meditation Teacher'],
      totalRatings: 89
    },
    {
      id: 104,
      name: 'CrossFit Pro Tom',
      age: 31,
      specialty: 'CrossFit & Olympic Lifting',
      distance: '3.2km',
      rating: 4.6,
      hourlyRate: '$70/hr',
      location: 'CrossFit Box',
      experience: '6 years',
      bio: 'CrossFit Level 2 trainer passionate about Olympic lifting and functional fitness. Let\'s crush some WODs!',
      certifications: ['CrossFit L2', 'USA Weightlifting'],
      totalRatings: 56
    },
    {
      id: 105,
      name: 'Nutrition Coach Anna',
      age: 28,
      specialty: 'Nutrition & Wellness',
      distance: '1.9km',
      rating: 4.9,
      hourlyRate: '$85/hr',
      location: 'Wellness Center',
      experience: '4 years',
      bio: 'Holistic nutrition coach combining fitness and nutrition for complete wellness transformation.',
      certifications: ['Precision Nutrition', 'Wellness Coach'],
      totalRatings: 42
    },
  ];

  const handleSwipeLeft = (item: SwipeableItem) => {
    const currentData = activeTab === 'partners' ? mockPartners : mockTrainers;
    setCurrentIndex(prev => Math.min(prev + 1, currentData.length - 1));
  };

  const handleSwipeRight = (item: SwipeableItem) => {
    const message = activeTab === 'partners' 
      ? `You and ${item.name} are a great match! Would you like to start a conversation?`
      : `Great choice! ${item.name} is available for training. Would you like to book a session?`;
    
    Alert.alert(
      activeTab === 'partners' ? 'Match! 🎉' : 'Book Trainer! 💪',
      message,
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Rate Experience',
          onPress: () => {
            setSelectedUserForRating({
              name: item.name,
              type: activeTab === 'partners' ? 'partner' : 'trainer'
            });
            setRatingModalVisible(true);
          },
        },
        {
          text: activeTab === 'partners' ? 'Start Chat' : 'Book Session',
          onPress: () => {
            if (activeTab === 'partners') {
              navigation.navigate('Chat', {
                partnerId: item.id.toString(),
                partnerName: item.name,
              });
            } else {
              // Handle trainer booking
              Alert.alert('Booking', `Booking session with ${item.name}`);
            }
          },
        },
      ]
    );
    const currentData = activeTab === 'partners' ? mockPartners : mockTrainers;
    setCurrentIndex(prev => Math.min(prev + 1, currentData.length - 1));
  };

  const resetCards = () => {
    setCurrentIndex(0);
  };

  const handleRatingSubmit = (rating: number, comment: string) => {
    if (selectedUserForRating) {
      Alert.alert(
        'Rating Submitted! ⭐',
        `Thank you for rating ${selectedUserForRating.name} with ${rating} stars!`,
        [{ text: 'OK' }]
      );
      // Here you would typically save the rating to your backend
    }
  };

  const handleCategorySelect = (category: string) => {
    if (category === 'All') {
      setSelectedFilters(['All']);
    } else {
      setSelectedFilters(prev => {
        const newFilters = prev.filter(f => f !== 'All');
        if (newFilters.includes(category)) {
          return newFilters.filter(f => f !== category);
        } else {
          return [...newFilters, category];
        }
      });
    }
    setCurrentIndex(0);
  };

  const getCurrentData = () => {
    const data = activeTab === 'partners' ? mockPartners : mockTrainers;
    if (selectedFilters.includes('All') || selectedFilters.length === 0) {
      return data;
    }
    return data.filter(item => {
      const type = activeTab === 'partners' 
        ? (item as TrainingPartner).type 
        : (item as Trainer).specialty;
      return selectedFilters.some(filter => 
        type.toLowerCase().includes(filter.toLowerCase())
      );
    });
  };

  const currentData = getCurrentData();
  const currentItem = currentData[currentIndex];
  const hasMoreCards = currentIndex < currentData.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Find Partners & Trainers</Text>
          <Text style={styles.subtitle}>Swipe to discover</Text>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'partners' && styles.tabButtonActive
            ]}
            onPress={() => {
              setActiveTab('partners');
              setCurrentIndex(0);
              setSelectedFilters(['All']);
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'partners' && styles.tabTextActive
            ]}>
              Partners
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'trainers' && styles.tabButtonActive
            ]}
            onPress={() => {
              setActiveTab('trainers');
              setCurrentIndex(0);
              setSelectedFilters(['All']);
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'trainers' && styles.tabTextActive
            ]}>
              Trainers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Training Categories Dropdown */}
        <View style={styles.filtersSection}>
          <View style={styles.dropdownContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.dropdownButton}
                  contentStyle={styles.dropdownButtonContent}
                  labelStyle={styles.dropdownButtonLabel}
                >
                  {selectedFilters.includes('All') || selectedFilters.length === 0 
                    ? 'All Categories' 
                    : `${selectedFilters.length} selected`}
                </Button>
              }
            >
              {trainingCategories.map((category) => (
                <Menu.Item
                  key={category}
                  onPress={() => {
                    handleCategorySelect(category);
                    setMenuVisible(false);
                  }}
                  title={category}
                  titleStyle={[
                    styles.menuItemText,
                    selectedFilters.includes(category) && styles.menuItemTextActive
                  ]}
                />
              ))}
            </Menu>
          </View>
          
          {/* Selected Categories Chips */}
          {selectedFilters.length > 0 && !selectedFilters.includes('All') && (
            <View style={styles.chipsWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.selectedChipsContainer}
              >
                {selectedFilters.map((filter) => (
                  <Chip
                    key={filter}
                    mode="outlined"
                    onClose={() => handleCategorySelect(filter)}
                    style={styles.selectedChip}
                    textStyle={styles.selectedChipText}
                  >
                    {filter}
                  </Chip>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Cards Section */}
      <View style={styles.cardsSection}>
        {currentItem ? (
          <SwipeableCard
            partner={currentItem}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            isFirst={true}
          />
        ) : (
          <View style={styles.noMoreCards}>
            <Text style={styles.noMoreCardsTitle}>No More Cards</Text>
            <Text style={styles.noMoreCardsText}>
              You've seen all available {activeTab} for this filter.
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetCards}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {currentData.length}
        </Text>
        {hasMoreCards && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => handleSwipeLeft(currentItem)}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRatingSubmit}
        userName={selectedUserForRating?.name || ''}
        userType={selectedUserForRating?.type || 'partner'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flex: 0,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.sm,
    paddingBottom: DIMENSIONS.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
  },
  tabButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: DIMENSIONS.spacing.sm,
    marginHorizontal: DIMENSIONS.spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  dropdownContainer: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.sm,
  },
  chipsWrapper: {
    minHeight: 40,
    justifyContent: 'center',
  },
  dropdownButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: DIMENSIONS.borderRadius,
    minWidth: 200,
  },
  dropdownButtonContent: {
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  dropdownButtonLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  menuItemText: {
    fontSize: 14,
    color: COLORS.text,
  },
  menuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedChipsContainer: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    height: 40,
  },
  selectedChip: {
    marginRight: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary,
  },
  selectedChipText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  cardsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.lg,
  },
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.spacing.xl,
  },
  noMoreCardsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.spacing.md,
  },
  noMoreCardsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  resetButton: {
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  progressText: {
    fontSize: 14,
  },
  skipButton: {
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FindScreen;

