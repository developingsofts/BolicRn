import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { Ionicons } from '@expo/vector-icons';

const reviews = [
  {
    id: '1',
    name: 'Frank',
    initial: 'F',
    avatarColor: '#0D8AFF',
    rating: 5,
    date: 'Yesterday',
    review:
      "Innovative thinker! Brings fresh ideas to the table and isn't afraid to challenge the status quo. Highly recommend collaborating!",
  },
  {
    id: '2',
    name: 'Clara',
    initial: 'C',
    avatarColor: '#0D8AFF',
    rating: 5,
    date: '2 days ago',
    review:
      "Awesome training partner! Always pushing me to do one more rep. Highly motivated and knowledgeable. Definitely recommend connecting.",
  },
  {
    id: '3',
    name: 'David',
    initial: 'D',
    avatarColor: '#0D8AFF',
    rating: 5,
    date: '1 week ago',
    review:
      "Great communicator! Always provides constructive feedback and is very supportive. A pleasure to work with.",
  },
  {
    id: '4',
    name: 'Eva',
    initial: 'E',
    avatarColor: '#0D8AFF',
    rating: 5,
    date: '3 days ago',
    review:
      "Incredible attention to detail! She always ensures that everything is perfect. A valuable member of any team.",
  },
];

const averageRating = 4.8;
const totalReviews = 24;

const MyRatings: React.FC = ({ navigation }: any) => {
  const handleBack = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Profile');
    }
  };
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={handleBack}
        title="My Ratings"
        subtitle="Track your achievements"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Rating Overview */}
        <View style={styles.ratingOverview}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(averageRating) ? 'star' : 'star-outline'}
                size={36}
                color={i < Math.floor(averageRating) ? '#FFD700' : COLORS._E2E2E2}
                style={{ marginHorizontal: 2 }}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {averageRating} ({totalReviews} Reviews)
          </Text>
        </View>
        {/* Reviews Section */}
        <Text style={styles.sectionTitle}>What people are saying</Text>
        <View style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={[styles.avatar, { backgroundColor: review.avatarColor }] }>
                  <Text style={styles.avatarText}>{review.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.reviewerName}>{review.name}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={18}
                        color={i < review.rating ? '#FFD700' : COLORS._E2E2E2}
                        style={{ marginHorizontal: 1 }}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.review}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  ratingOverview: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 12,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FontWeight.Bold,
    fontSize: 18,
  },
  reviewerName: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  reviewDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FontWeight.Regular,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    marginTop: 2,
  },
});

export default MyRatings;
