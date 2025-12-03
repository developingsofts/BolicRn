import React, { use, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { useAuth } from "../contexts/AuthContext";
import { useGetUserConnectionsQuery } from "../services/api/connectionsApi";

const Connections: React.FC = ({ navigation, route }: any) => {
  const { user, isAuthenticated } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile =
    !route?.params?.userId || route?.params?.userId === user?.id;
    
  const handleAddNew = () => {
    // TODO: Implement add new connection logic
    alert("Add new connection feature coming soon!");
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [allFollowing, setAllFollowing] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: connectionsData,
    isLoading: connectionsLoading,
    isFetching: connectionsFetching,
    refetch: refetchConnections,
    error: connectionsError,
  } = useGetUserConnectionsQuery(
    {
      userId: userId,
      page,
      limit: 20,
    },
    { skip: !isAuthenticated }
  );

  // Append new users to allFollowing on data change
  useEffect(() => {
    if (connectionsData?.status) {
      // API returns users under data.users
      const items = (connectionsData.data?.users as any[]) ?? [];
      if (page === 1) {
        setAllFollowing(items);
      } else {
        setAllFollowing((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((u) => u.id || u._id));
          const newItems = items.filter((u) => !existingIds.has(u.id || u._id));
          return [...prev, ...newItems];
        });
      }
      setHasMore(items.length === 20); // If less than limit, no more pages
    }
  }, [connectionsData, page]);

  // Stop refreshing when fetch completes
  useEffect(() => {
    if (refreshing && !connectionsFetching) {
      setRefreshing(false);
    }
  }, [connectionsFetching, refreshing]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setAllFollowing([]);
    await refetchConnections();
  };

  // Memoize following users for rendering
  const following = React.useMemo(() => {
    if (!Array.isArray(allFollowing)) return [];
    return allFollowing.map((user: any) => ({
      id: String(user?.id ?? user?._id ?? Math.random()),
      name: user?.displayName || user?.name || 'Unknown',
      location: user?.location || '',
      initial: (user?.displayName || user?.name || '?').charAt(0).toUpperCase(),
    }));
  }, [allFollowing]);

  const handleLoadMore = () => {
    if (hasMore && !connectionsFetching) {
      setPage((prev) => prev + 1);
    }
  };

  const handleMessage = (connection: any) => {
    if (connection) {
      navigation.navigate("Chat", {
        partnerId: connection.id.toString(),
        partnerName: connection.name,
      });
    }
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={isOwnProfile ? "Connections" : "User Connections"}
        subtitle={
          isOwnProfile ? "View / Add Connections" : "View user connections"
        }
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {isOwnProfile && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        )}
        {/* Achievements-style grid/list with loading, error, empty states */}
        {connectionsLoading && page === 1 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>Loading connections...</Text>
          </View>
        ) : connectionsError ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: COLORS.error }}>Failed to load connections.</Text>
          </View>
        ) : following.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text>No connections yet.</Text>
          </View>
        ) : (
          <>
            <View style={styles.connectionList}>
              {following.map((connection) => (
                <View key={connection.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{connection.initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{connection.name}</Text>
                      <Text style={styles.location}>{connection.location}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.messageButton}
                      onPress={() => handleMessage(connection)}
                    >
                      <Text style={styles.messageButtonText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            {hasMore && (
              <TouchableOpacity
                style={{
                  marginTop: 20,
                  alignSelf: 'center',
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
                onPress={handleLoadMore}
                disabled={connectionsFetching}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                  {connectionsFetching ? 'Loading...' : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
  addButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FontWeight.SemiBold,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  connectionList: {
    gap: 16,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS._D2E7FF,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: COLORS._0B80FF,
    fontFamily: FontWeight.Bold,
    fontSize: 20,
  },
  name: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  location: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FontWeight.Regular,
  },
  messageButton: {
    marginLeft: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00000033",
    backgroundColor: COLORS.white,
    alignSelf: "flex-start",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageButtonText: {
    color: COLORS.app_black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default Connections;
