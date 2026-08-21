import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import BasicTopBar from '../components/BasicTopBar';
import RefreshableScrollView from '../components/RefreshableScrollView';
import RatingModal from '../components/RatingModal';
import { COLORS, DIMENSIONS } from '../config/constants';
import STRINGS from '../config/strings';
import FontWeight from '../hooks/useInterFonts';
import { useAuth } from '../contexts/AuthContext';
import { useGetUserProfileQuery } from '../services/api/userApi';
import {
  useGetUserRatingsQuery,
  RATINGS_PAGE_SIZE,
} from '../services/api/ratingsApi';
import type { Rating, RatingSummary, RatingsPagination } from '../types';

const EMPTY_SUMMARY: RatingSummary = {
  average: 0,
  count: 0,
  breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

const formatRatingDate = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const days = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString();
};

const raterName = (rating: Rating) =>
  rating.rater?.displayName || rating.rater?.userName || 'Anonymous';

const MyRatings: React.FC = ({ navigation, route }: any) => {
  const { user, isAuthenticated } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile =
    !route?.params?.userId || route?.params?.userId === user?.id;

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: ratingsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUserRatingsQuery(
    { userId: userId ?? '', page, limit: RATINGS_PAGE_SIZE },
    { skip: !userId || !isAuthenticated },
  );

  const payload =
    ratingsData && ratingsData.status === true ? ratingsData.data : null;

  const [summary, setSummary] = useState<RatingSummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<RatingsPagination | null>(null);
  const [myRating, setMyRating] = useState<Rating | null>(null);

  useEffect(() => {
    if (!payload) return;

    setSummary(payload.summary ?? EMPTY_SUMMARY);
    setPagination(payload.pagination ?? null);
    setMyRating(payload.myRating ?? null);

    const incoming = payload.ratings ?? [];
    if (page === 1) {
      setAllRatings(incoming);
      return;
    }
    setAllRatings((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...incoming.filter((item) => !seen.has(item.id))];
    });
  }, [payload, page]);

  useEffect(() => {
    if (refreshing && !isFetching) setRefreshing(false);
  }, [isFetching, refreshing]);

  const { data: ratedProfileData } = useGetUserProfileQuery(userId || '', {
    skip: isOwnProfile || !userId || !isAuthenticated,
  });

  const ratedProfile =
    ratedProfileData && ratedProfileData.status === true
      ? (ratedProfileData.data as any)
      : null;

  const ratedName =
    ratedProfile?.displayName ||
    ratedProfile?.userName ||
    route?.params?.name ||
    'this user';
  const ratedImageUrl =
    ratedProfile?.imageUrl || ratedProfile?.profilePicture || null;
  const ratedRole = ratedProfile?.role === 'trainer' ? 'trainer' : 'partner';

  const averageLabel = useMemo(
    () => (summary.count > 0 ? summary.average.toFixed(1) : '0.0'),
    [summary],
  );
  const countLabel =
    summary.count === 1
      ? STRINGS.RATING.reviewSuffix
      : STRINGS.RATING.reviewsSuffix;

  const handleBack = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Profile');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    refetch();
  };

  const handleLoadMore = () => {
    if (!isFetching && pagination?.hasMore) setPage((prev) => prev + 1);
  };

  const handleSubmitted = () => {
    setPage(1);
    refetch();
  };

  const showInitialLoader = isLoading && allRatings.length === 0;
  const showEmpty =
    !isLoading && !error && allRatings.length === 0 && summary.count === 0;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={handleBack}
        title={isOwnProfile ? 'My Ratings' : 'User Ratings'}
        subtitle={
          isOwnProfile ? 'Ratings people left you' : 'View user ratings'
        }
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />

      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => setRatingModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.rateButtonText}>
              {myRating
                ? STRINGS.RATING.rateButtonEdit
                : STRINGS.RATING.rateButton}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.ratingOverview}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(summary.average) ? 'star' : 'star-outline'}
                size={36}
                color={
                  i < Math.round(summary.average)
                    ? COLORS.primary
                    : COLORS.border
                }
                style={{ marginHorizontal: 2 }}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {averageLabel} ({summary.count} {countLabel})
          </Text>
        </View>

        {showInitialLoader && (
          <View style={styles.stateBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>{STRINGS.RATING.loading}</Text>
          </View>
        )}

        {!!error && !isLoading && (
          <View style={styles.stateBlock}>
            <Text style={styles.stateText}>{STRINGS.RATING.loadFailed}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>
                {STRINGS.RATING.retry}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showEmpty && (
          <View style={styles.stateBlock}>
            <Text style={styles.emptyTitle}>{STRINGS.RATING.emptyTitle}</Text>
            <Text style={styles.stateText}>
              {STRINGS.RATING.emptySubtitle}
            </Text>
          </View>
        )}

        {allRatings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>What people are saying</Text>
            <View style={styles.reviewsList}>
              {allRatings.map((rating) => {
                const name = raterName(rating);
                const photo = rating.rater?.imageUrl;
                const isMine = myRating?.id === rating.id;

                return (
                  <View key={rating.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {photo ? (
                        <Image
                          source={{ uri: photo }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                          <Text style={styles.avatarText}>
                            {name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.reviewNameRow}>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {name}
                            {isMine ? ` · ${STRINGS.RATING.yourRating}` : ''}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {formatRatingDate(rating.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={
                                i < rating.score ? 'star' : 'star-outline'
                              }
                              size={18}
                              color={
                                i < rating.score
                                  ? COLORS.primary
                                  : COLORS.border
                              }
                              style={{ marginHorizontal: 1 }}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.reviewText,
                        !rating.review && styles.reviewTextMuted,
                      ]}
                    >
                      {rating.review || STRINGS.RATING.noComment}
                    </Text>
                  </View>
                );
              })}
            </View>

            {pagination?.hasMore && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isFetching}
                activeOpacity={0.85}
              >
                {isFetching ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.loadMoreText}>
                    {STRINGS.RATING.loadMore}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </RefreshableScrollView>

      {!isOwnProfile && (
        <RatingModal
          visible={ratingModalVisible}
          onClose={() => setRatingModalVisible(false)}
          rateeId={userId}
          name={ratedName}
          imageUrl={ratedImageUrl}
          role={ratedRole}
          existingRating={myRating}
          onSubmitted={handleSubmitted}
        />
      )}
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
  rateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: DIMENSIONS.buttonHeight + 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DIMENSIONS.spacing.md,
  },
  rateButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  ratingOverview: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
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
  stateBlock: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.xl,
    gap: DIMENSIONS.spacing.sm,
  },
  stateText: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  retryButton: {
    marginTop: DIMENSIONS.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  retryButtonText: {
    fontSize: 14,
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
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewerName: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  reviewStars: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.text,
    lineHeight: 20,
  },
  reviewTextMuted: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loadMoreButton: {
    marginTop: DIMENSIONS.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: DIMENSIONS.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
  },
});

export default MyRatings;
