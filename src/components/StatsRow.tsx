import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

interface Stat {
  icon: any;
  count: number | string;
  title: string;
}

interface StatsRowProps {
  stats: Stat[];
  dividerColor?: string;
  style?: any;
}

const StatsRow: React.FC<StatsRowProps> = ({ stats, dividerColor = COLORS.border, style }) => (
  <View style={[styles.statsRow, style]}>
    {stats.map((stat, idx) => (
      <React.Fragment key={stat.title + idx}>
        <View style={styles.statItem}>
          <Image source={stat.icon} style={styles.smallIconSize} />
          <Text style={styles.statNumber}>{stat.count}</Text>
          <Text style={styles.statLabel}>{stat.title}</Text>
        </View>
        {idx < stats.length - 1 && (
          <View style={[styles.statDivider, { backgroundColor: dividerColor }]} />
        )}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: '90%',
    // Floats over the bottom edge of the profile header. Because this is
    // absolutely positioned it has no layout height, so the header reserves
    // space via its own paddingBottom (see `profileHeader` in ProfileScreen)
    // and the content below compensates with its own top margin. Changing
    // this offset means revisiting both.
    position: 'absolute',
    alignSelf: 'center',
    bottom: -40,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '70%',
    opacity: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  smallIconSize: {
    width: 24,
    height: 24,
    marginRight: 5,
    tintColor: COLORS.white,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.app_black,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
    textTransform: 'uppercase',
  },
});

export default StatsRow;
