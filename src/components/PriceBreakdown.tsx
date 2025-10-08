import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { COLORS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";

export interface PriceItem {
  label: string;
  amount: number;
  isDiscount?: boolean;
}

interface PriceBreakdownProps {
  items: PriceItem[];
  total: number;
}

const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`;
};

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ items, total }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Price Breakdown</Text>
      <View style={styles.listContainer}>
        {items.map((item, index) => {
          const amountPrefix = item.isDiscount ? "-" : "";
          return (
            <View key={`${item.label}-${index}`} style={styles.row}>
              <Text
                style={[
                  styles.rowLabel,
                  item.isDiscount && styles.discountLabel,
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.rowValue,
                  item.isDiscount && styles.discountValue,
                ]}
              >
                {`${amountPrefix}${formatCurrency(item.amount)}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: r(16),
    borderRadius: r(16),
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontFamily: FontWeight.SemiBold,
    fontSize: r(12, "font"),
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: r(12, "height"),
  },
  listContainer: {
    gap: r(12, "height"),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
    fontFamily: FontWeight.Medium,
    fontSize: r(14, "font"),
    color: COLORS.text,
  },
  rowValue: {
    fontFamily: FontWeight.SemiBold,
    fontSize: r(14, "font"),
    color: COLORS.text,
  },
  discountLabel: {
    color: COLORS.success,
  },
  discountValue: {
    color: COLORS.success,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: r(16, "height"),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: FontWeight.Bold,
    fontSize: r(18, "font"),
    color: COLORS.text,
  },
  totalValue: {
    fontFamily: FontWeight.Bold,
    fontSize: r(18, "font"),
    color: COLORS.text,
  },
});

export default PriceBreakdown;
