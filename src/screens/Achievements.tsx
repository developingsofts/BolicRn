import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import { REFRESH_INDICATOR_PROPS } from "../components/RefreshableScrollView";
import FontWeight from "../hooks/useInterFonts";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  useGetUserAchievementsQuery,
  useGetAchievementCatalogueQuery,
} from "../services/api";
import type { AchievementCatalogueItem } from "../services/api/workoutApi";
import { STRINGS } from "../config/strings";
import { Achievement as AchievementIcon } from "../../assets";

interface AchievementRow {
  id: string;
  title: string;
  description: string;
  type?: string;
  unlocked: boolean;
  /** Real progress from the API, or null when the API does not report it. */
  progress: number | null;
  /** Real target from the API, or null when the API does not report it. */
  target: number | null;
  earnedAt: Date | null;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatEarnedDate = (date: Date | null) => {
  if (!date) return null;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Every identifier a row could be matched on, so earned/catalogue rows can be diffed. */
const identityKeys = (raw: any): string[] => {
  const keys: string[] = [];
  const push = (value: unknown, prefix: string) => {
    if (value === null || value === undefined || value === "") return;
    keys.push(`${prefix}:${String(value).trim().toLowerCase()}`);
  };
  push(raw?.id, "id");
  push(raw?.achievementId, "id");
  push(raw?.achivenmentId, "id");
  push(raw?.achievement?.id, "id");
  push(raw?.key ?? raw?.code ?? raw?.slug, "key");
  push(raw?.title ?? raw?.name ?? raw?.achievement?.title, "title");
  return keys;
};

const normalizeRow = (raw: any, unlocked: boolean): AchievementRow | null => {
  if (!raw || typeof raw !== "object") return null;

  const nested = raw?.achievement && typeof raw.achievement === "object" ? raw.achievement : {};
  const title = raw?.title ?? raw?.name ?? nested?.title ?? nested?.name ?? null;
  const idSource =
    raw?.id ??
    raw?.achievementId ??
    raw?.achivenmentId ??
    nested?.id ??
    raw?.key ??
    raw?.code ??
    raw?.slug ??
    title;

  if (idSource === null || idSource === undefined) return null;

  const earnedAt = toDate(raw?.earnedAt ?? raw?.unlockedAt ?? nested?.earnedAt ?? raw?.createdAt);
  const progress = toNumber(raw?.progress ?? raw?.currentProgress ?? raw?.progressValue);
  const target = toNumber(
    raw?.target ?? raw?.maxProgress ?? raw?.goal ?? raw?.threshold ?? nested?.target
  );

  const description = String(raw?.description ?? nested?.description ?? "");
  // Nothing to label the row with — drop it rather than render an empty card or
  // invent copy for it.
  if (!title && !description) return null;

  return {
    id: String(idSource),
    title: title ? String(title) : "",
    description,
    type: raw?.type ?? nested?.type ?? undefined,
    unlocked,
    progress,
    target: target !== null && target > 0 ? target : null,
    earnedAt,
  };
};

/** The catalogue endpoint may return a bare array or a wrapped list; tolerate both. */
const extractCatalogueItems = (payload: unknown): AchievementCatalogueItem[] => {
  if (Array.isArray(payload)) return payload as AchievementCatalogueItem[];
  if (payload && typeof payload === "object") {
    const wrapper = payload as Record<string, unknown>;
    const candidate =
      wrapper.achievements ?? wrapper.achivements ?? wrapper.items ?? wrapper.data;
    if (Array.isArray(candidate)) return candidate as AchievementCatalogueItem[];
  }
  return [];
};

const Achievements: React.FC = ({ navigation, route }: any) => {
  const { user, isAuthenticated } = useAuth();
  const userId = route?.params?.userId || user?.id;
  const isOwnProfile =
    !route?.params?.userId || route?.params?.userId === user?.id;
  const handleBookSession = () => {
    navigation.navigate("Main", {
      screen: "Find",
      params: {
        screen: "FindMain",
        params: { tab: "FindTrainers" },
      },
    });
  };

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAchievements(),
      isOwnProfile ? refetchCatalogue() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };
  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    refetch: refetchAchievements,
    error: achievementsError,
  } = useGetUserAchievementsQuery(
    // `include=locked` is only meaningful on your own profile: locked rows and
    // their progress cannot be attributed to another user.
    { userId: userId, includeLocked: isOwnProfile },
    { skip: !isAuthenticated }
  );

  // The catalogue is the full list of achievements that exist. It is only used on your
  // own profile: locked rows describe *your* remaining achievements, and any progress
  // numbers it carries cannot be attributed to another user.
  const {
    data: catalogueData,
    isLoading: catalogueLoading,
    refetch: refetchCatalogue,
    error: catalogueError,
  } = useGetAchievementCatalogueQuery(undefined, {
    skip: !isAuthenticated || !isOwnProfile,
  });

  const earned = React.useMemo<{ rows: AchievementRow[]; keys: Set<string> }>(() => {
    if (!achievementsData?.status) return { rows: [], keys: new Set<string>() };
    const items = Array.isArray(achievementsData.data)
      ? (achievementsData.data as any[])
      : extractCatalogueItems(achievementsData.data);

    const keys = new Set<string>();
    const rows: AchievementRow[] = [];

    items.forEach((item: any) => {
      // Without `include=locked` this endpoint returns earned rows only, so mere
      // presence implies unlocked. With it (own profile) the response is the whole
      // catalogue, so a row counts as unlocked only when the payload says so — a
      // flag or an earned date. Defaulting to true there would resurrect the old
      // bug of faking every achievement as earned.
      const explicit =
        typeof item?.unlocked === "boolean"
          ? item.unlocked
          : typeof item?.earned === "boolean"
            ? item.earned
            : isOwnProfile
              ? Boolean(item?.earnedAt ?? item?.unlockedAt)
              : true;
      const row = normalizeRow(item, explicit);
      if (!row) return;
      identityKeys(item).forEach((key) => keys.add(key));
      keys.add(`id:${row.id.trim().toLowerCase()}`);
      if (row.title) keys.add(`title:${row.title.trim().toLowerCase()}`);
      rows.push(row);
    });

    return { rows, keys };
  }, [achievementsData, isOwnProfile]);

  const earnedRows = earned.rows;

  const catalogueItems = React.useMemo<AchievementCatalogueItem[]>(() => {
    if (!catalogueData?.status) return [];
    return extractCatalogueItems(catalogueData.data);
  }, [catalogueData]);

  const lockedRows = React.useMemo<AchievementRow[]>(() => {
    if (catalogueItems.length === 0) return [];

    const earnedKeys = earned.keys;
    const seen = new Set<string>();

    return catalogueItems
      .map((item: any) => {
        const keys = identityKeys(item);
        const alreadyEarned =
          keys.some((key) => earnedKeys.has(key)) ||
          item?.earned === true ||
          item?.unlocked === true;
        if (alreadyEarned) return null;

        const row = normalizeRow(item, false);
        if (!row) return null;
        const dedupeKey = row.title
          ? `title:${row.title.trim().toLowerCase()}`
          : `id:${row.id}`;
        if (seen.has(dedupeKey)) return null;
        seen.add(dedupeKey);
        return row;
      })
      .filter((row): row is AchievementRow => row !== null);
  }, [catalogueItems, earned]);

  const sortedEarned = React.useMemo(
    () =>
      earnedRows
        .filter((row) => row.unlocked)
        .sort((a, b) => (b.earnedAt?.getTime() ?? 0) - (a.earnedAt?.getTime() ?? 0)),
    [earnedRows]
  );

  const sortedLocked = React.useMemo(
    () =>
      // A row the earned endpoint explicitly flags as not earned belongs here too.
      [...lockedRows, ...earnedRows.filter((row) => !row.unlocked)].sort((a, b) => {
        const ratio = (row: AchievementRow) =>
          row.target && row.progress !== null ? row.progress / row.target : -1;
        const diff = ratio(b) - ratio(a);
        if (diff !== 0) return diff;
        return a.title.localeCompare(b.title);
      }),
    [lockedRows, earnedRows]
  );

  const isLoading = achievementsLoading || (isOwnProfile && catalogueLoading);
  const catalogueUnavailable =
    isOwnProfile && !catalogueLoading && (Boolean(catalogueError) || catalogueItems.length === 0);
  const totalCount = sortedEarned.length + sortedLocked.length;

  /**
   * Real progress only. Returns null when the API gives us nothing to show, so the
   * bar is omitted instead of being faked.
   */
  const getProgressPercentage = (row: AchievementRow): number | null => {
    if (row.unlocked) return 100;
    if (row.target && row.target > 0 && row.progress !== null) {
      // Observed live: the server currently returns progress=1/target=1 on every
      // locked row (placeholder data, BACKEND-ASK item 36). A locked row claiming
      // complete progress is contradictory, so omit the bar rather than draw a
      // full one under a lock.
      if (row.progress >= row.target) return null;
      return Math.max(0, Math.min((row.progress / row.target) * 100, 100));
    }
    return null;
  };

  const renderCard = (row: AchievementRow) => {
    const progressPercentage = getProgressPercentage(row);
    const earnedDate = formatEarnedDate(row.earnedAt);
    // Same rule as the bar: a locked row whose progress already meets its target
    // is contradictory placeholder data (the live server returns progress=1/
    // target=1 on every locked row — BACKEND-ASK item 36). Printing "1/1" under
    // "Complete 10 cardio workouts" reads as done, so show nothing instead.
    const showFraction =
      !row.unlocked &&
      row.target !== null &&
      row.progress !== null &&
      (row.progress as number) < (row.target as number);

    return (
      <View
        key={`${row.unlocked ? "earned" : "locked"}-${row.id}`}
        style={[styles.achievementCard, !row.unlocked && styles.lockedCard]}
      >
        <View style={styles.iconRow}>
          <Image
            source={AchievementIcon}
            style={[
              styles.achievementIcon,
              !row.unlocked && styles.lockedAchievementIcon,
            ]}
            resizeMode="contain"
          />
          <Ionicons
            name={row.unlocked ? "checkmark-circle" : "lock-closed"}
            size={16}
            color={row.unlocked ? COLORS.success : COLORS.textSecondary}
          />
        </View>
        <Text
          style={[
            styles.achievementTitle,
            !row.unlocked && styles.lockedText,
          ]}
        >
          {row.title}
        </Text>
        {row.description ? (
          <Text style={styles.achievementDescription}>{row.description}</Text>
        ) : null}
        {progressPercentage !== null ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: row.unlocked
                      ? COLORS.success
                      : COLORS.textSecondary,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
        <Text style={styles.progressText}>
          {row.unlocked
            ? earnedDate
              ? STRINGS.ACHIEVEMENTS.earnedOn(earnedDate)
              : STRINGS.ACHIEVEMENTS.earnedLabel
            : showFraction
              ? STRINGS.ACHIEVEMENTS.progressLabel(
                  row.progress as number,
                  row.target as number
                )
              : STRINGS.ACHIEVEMENTS.lockedLabel}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title={
          isOwnProfile
            ? STRINGS.ACHIEVEMENTS.title
            : STRINGS.ACHIEVEMENTS.titleOther
        }
        subtitle={
          isOwnProfile
            ? STRINGS.ACHIEVEMENTS.subtitle
            : STRINGS.ACHIEVEMENTS.subtitleOther
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
            onRefresh={onRefresh}
            {...REFRESH_INDICATOR_PROPS}
          />
        }
      >
        <TouchableOpacity style={styles.bookButton} onPress={handleBookSession}>
          <Text style={styles.bookButtonText}>
            {STRINGS.ACHIEVEMENTS.bookSession}
          </Text>
        </TouchableOpacity>
        {isLoading ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateText}>{STRINGS.ACHIEVEMENTS.loading}</Text>
          </View>
        ) : achievementsError ? (
          <View style={styles.stateBlock}>
            <Text style={styles.errorText}>
              {STRINGS.ACHIEVEMENTS.loadFailed}
            </Text>
          </View>
        ) : totalCount === 0 ? (
          <View style={styles.stateBlock}>
            <Text style={styles.stateText}>
              {isOwnProfile
                ? STRINGS.ACHIEVEMENTS.empty
                : STRINGS.ACHIEVEMENTS.emptyOther}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.summaryText}>
              {sortedLocked.length > 0
                ? STRINGS.ACHIEVEMENTS.summary(sortedEarned.length, totalCount)
                : STRINGS.ACHIEVEMENTS.earnedCount(sortedEarned.length)}
            </Text>
            {catalogueUnavailable && sortedEarned.length > 0 ? (
              <Text style={styles.noticeText}>
                {STRINGS.ACHIEVEMENTS.catalogueUnavailable}
              </Text>
            ) : null}

            {sortedEarned.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  {STRINGS.ACHIEVEMENTS.earnedSection}
                </Text>
                <View style={styles.achievementsGrid}>
                  {sortedEarned.map(renderCard)}
                </View>
              </>
            ) : null}

            {sortedLocked.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  {STRINGS.ACHIEVEMENTS.lockedSection}
                </Text>
                <View style={styles.achievementsGrid}>
                  {sortedLocked.map(renderCard)}
                </View>
              </>
            ) : null}
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
  bookButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
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
  bookButtonText: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  stateBlock: {
    padding: DIMENSIONS.spacing.lg,
    alignItems: "center",
  },
  stateText: {
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
    fontSize: 13,
    textAlign: "center",
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FontWeight.Regular,
    fontSize: 13,
    textAlign: "center",
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
    fontSize: 12,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  noticeText: {
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
    fontSize: 11,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FontWeight.SemiBold,
    fontSize: 14,
    marginTop: DIMENSIONS.spacing.sm,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  lockedCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.75,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DIMENSIONS.spacing.sm,
    width: "100%",
  },
  achievementIcon: {
    width: 26,
    height: 26,
    tintColor: COLORS.text,
  },
  lockedAchievementIcon: {
    tintColor: COLORS.textSecondary,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: DIMENSIONS.spacing.xs,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: DIMENSIONS.spacing.sm,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: DIMENSIONS.spacing.xs,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FontWeight.Regular,
    alignSelf: "stretch",
    textAlign: "left",
  },
});

export default Achievements;
