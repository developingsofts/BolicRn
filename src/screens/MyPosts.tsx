

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { Like, CommentIcon } from '../../assets';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { useAuth } from '../contexts/AuthContext';

const mockPosts = [
  {
    id: '1',
    content: 'Great morning run! Feeling energized for the day. Who else got their workout in?',
    timestamp: '1d ago',
    likes: 241,
    comments: 4,
    hasImage: false,
  },
  {
    id: '2',
    content: 'Great morning run! Feeling energized for the day. Who else got their workout in?',
    timestamp: '2d ago',
    likes: 21,
    comments: 2,
    hasImage: true,
  },
];

const MyPosts: React.FC = ({ navigation }: any) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState(mockPosts);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch posts from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePostAction = (action: string, postId: string) => {
    Alert.alert(`${action} post ${postId}`);
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="My Posts"
        subtitle="View / Manage your shared posts"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => handlePostAction('create', '')}
        >
          <Text style={styles.createPostButtonText}>Create New Post</Text>
        </TouchableOpacity>

        <View style={styles.postsList}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatarContainer}>
                  {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{user?.displayName?.charAt(0) || 'U'}</Text>
                  )}
                </View>
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.postUserName}>{user?.displayName || 'You'}</Text>
                  <Text style={styles.postTimestamp}>{post.timestamp}</Text>
                </View>
                <TouchableOpacity
                  style={styles.postMenuButton}
                  onPress={() => handlePostAction('menu', post.id)}
                >
                  <Text style={styles.postMenuDots}>⋮</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.hasImage && (
                <View style={styles.postImagePlaceholder} />
              )}

              <View style={styles.postMetaRow}>
                <Text style={styles.postTimestampLeft}>{post.timestamp}</Text>
                <View style={styles.postMetaIconsRight}>
                  <View style={styles.postMetaItem}>
                    <Image source={Like} style={styles.postMetaIconImage} />
                    <Text style={styles.postMetaText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postMetaItem}>
                    <Image source={CommentIcon} style={styles.postMetaIconImage} />
                    <Text style={styles.postMetaText}>{post.comments}</Text>
                  </View>
                </View>
              </View>
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
  header: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  createPostButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  createPostButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FontWeight.Medium,
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  postTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
  },
  postMenuButton: {
    padding: 4,
    marginLeft: 8,
  },
  postMenuDots: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  postContent: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FontWeight.Regular,
    marginBottom: 8,
  },
  postImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS._E2E2E2,
    borderRadius: 12,
    marginBottom: 8,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  postTimestampLeft: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
  },
  postMetaIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  postMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postMetaIconImage: {
    width: 20,
    height: 20,
    tintColor: COLORS.gradient1,
  },
  postMetaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Medium,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '600',
    marginTop: -2,
  },
});

export default MyPosts;
