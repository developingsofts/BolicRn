import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import RefreshableScrollView from '../components/RefreshableScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { Like, CommentIcon } from '../../assets';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';
import { useAuth } from '../contexts/AuthContext';
import { useGetUserPostsQuery } from '../services/api';


const MyPosts: React.FC = ({ navigation, route }: any) => {
  const { user } = useAuth();
  // Accept userId from route params (if present)
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === user?.id;
  const [refreshing, setRefreshing] = useState(false);
  // Fetch posts for the correct user
  const { data: postsData, refetch: refetchPosts, isLoading } = useGetUserPostsQuery({ userId }, { skip: !userId });
  const posts = postsData && postsData.status && 'data' in postsData ? postsData.data.posts : [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchPosts();
    setRefreshing(false);
  };

  const handlePostAction = (action: string, postId: string) => {
    if (action === 'create') {
      navigation.navigate('CreatePost');
    } else {
      Alert.alert(`${action} post ${postId}`);
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={isOwnProfile ? 'My Posts' : 'Posts'}
        subtitle={isOwnProfile ? 'View / Manage your shared posts' : 'Posts shared by this user'}
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />

      <RefreshableScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => handlePostAction('create', '')}
          >
            <Text style={styles.createPostButtonText}>Create New Post</Text>
          </TouchableOpacity>
        )}

        <View style={styles.postsList}>
          {isLoading ? (
            <Text>Loading...</Text>
          ) : posts.length === 0 ? (
            <Text style={{ textAlign: 'center', color: COLORS._5E5E5E, marginTop: 32 }}>No posts yet.</Text>
          ) : (
            posts.map((post: any) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatarContainer}>
                    {post.user?.imageUrl ? (
                      <Image source={{ uri: post.user.imageUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{post.user?.displayName?.charAt(0) || 'U'}</Text>
                    )}
                  </View>
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.postUserName}>{post.user?.displayName || 'User'}</Text>
                    <Text style={styles.postTimestamp}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</Text>
                  </View>
                  {isOwnProfile && (
                    <TouchableOpacity
                      style={styles.postMenuButton}
                      onPress={() => handlePostAction('menu', post.id)}
                    >
                      <Text style={styles.postMenuDots}>⋮</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.postContent}>{post.title || post.content}</Text>

                {post.mediaUrl && (
                  <Image source={{ uri: post.mediaUrl }} style={styles.postImagePlaceholder} />
                )}

                <View style={styles.postMetaRow}>
                  <Text style={styles.postTimestampLeft}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</Text>
                  <View style={styles.postMetaIconsRight}>
                    <View style={styles.postMetaItem}>
                      <Image source={Like} style={styles.postMetaIconImage} />
                      <Text style={styles.postMetaText}>{post.likeCount || 0}</Text>
                    </View>
                    <View style={styles.postMetaItem}>
                      <Image source={CommentIcon} style={styles.postMetaIconImage} />
                      <Text style={styles.postMetaText}>{post.commentCount || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </RefreshableScrollView>
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
