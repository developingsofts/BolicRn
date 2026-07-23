import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  COLORS,
} from "../config/constants";
import { STRINGS } from "../config/strings";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { BookingData } from "../services/api/bookingApi";

interface CancellationConfirmationModalProps {
  visible: boolean;
  booking: BookingData | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const CancellationConfirmationModal: React.FC<
  CancellationConfirmationModalProps
> = ({
  visible,
  booking,
  isLoading = false,
  onClose,
  onConfirm,
  title = STRINGS.SCHEDULED_SESSIONS.cancellationModal.title,
  subtitle = STRINGS.SCHEDULED_SESSIONS.cancellationModal.subtitle,
  confirmButtonText = STRINGS.SCHEDULED_SESSIONS.cancellationModal.confirmButton,
  cancelButtonText = STRINGS.COMMON.cancel,
}) => {
  const calculateRefundAmount = () => {
    if (!booking?.price) return 0;
    return booking.price.price || 0;
  };

  const calculateProcessingFee = (amount: number) => {
    return parseFloat(((amount * 3) / 100).toFixed(2));
  };

  const totalRefundable = () => {
    const amount = calculateRefundAmount();
    const fee = calculateProcessingFee(amount);
    return parseFloat((amount - fee).toFixed(2));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Feather name="x" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            contentContainerStyle={styles.modalScrollContent}
          >
            <View style={styles.modalHeader}>
              <Feather
                name="alert-circle"
                size={40}
                color={COLORS.error}
                style={{ marginBottom: r(12, "height") }}
              />
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>

            <View style={styles.policySection}>
              <Text style={styles.policySectionTitle}>
                {STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundTerms}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>
                  {STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundLabels.sessionAmount}
                </Text>
                <Text style={styles.amountValue}>
                  ${calculateRefundAmount().toFixed(2)}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>
                  {STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundLabels.processingFee}
                </Text>
                <Text style={[styles.amountValue, styles.feeAmount]}>
                  -${calculateProcessingFee(calculateRefundAmount()).toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={[styles.amountRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>
                  {STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundLabels.refundableAmount}
                </Text>
                <Text style={styles.totalAmount}>
                  ${totalRefundable().toFixed(2)}
                </Text>
              </View>

              <View style={styles.policyDetails}>
                <View style={styles.policyDetailRow}>
                  <View
                    style={[
                      styles.policyDetailDot,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
                  <Text style={styles.policyDetailText}>
                    {STRINGS.SCHEDULED_SESSIONS.cancellationModal.details[0]}
                  </Text>
                </View>
                <View style={styles.policyDetailRow}>
                  <View
                    style={[
                      styles.policyDetailDot,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
                  <Text style={styles.policyDetailText}>
                    {STRINGS.SCHEDULED_SESSIONS.cancellationModal.details[1]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelActionButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelActionButtonText}>
                  {cancelButtonText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmActionButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.black} size="small" />
                ) : (
                  <Text style={styles.confirmActionButtonText}>
                    {confirmButtonText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: r(12, "height"),
    paddingHorizontal: r(16),
    paddingBottom: r(24, "height"),
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: r(8),
    marginBottom: r(12, "height"),
  },
  modalScrollView: {},
  modalScrollContent: {
    paddingBottom: r(20, "height"),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: r(16, "height"),
    paddingHorizontal: r(8),
  },
  modalTitle: {
    fontSize: r(16, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: r(4, "height"),
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: r(14, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: r(20),
  },
  policySection: {
    backgroundColor: COLORS.background,
    borderRadius: r(12),
    padding: r(12),
    marginBottom: r(14, "height"),
  },
  policySectionTitle: {
    fontSize: r(12, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: r(10, "height"),
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: r(6, "height"),
    paddingVertical: r(4, "height"),
  },
  amountLabel: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  feeAmount: {
    color: COLORS.app_black
    ,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: r(8, "height"),
  },
  totalRow: {
    paddingVertical: r(8, "height"),
    marginBottom: r(10, "height"),
  },
  totalLabel: {
    fontSize: r(14, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: r(16, "font"),
    fontFamily: FontWeight.Bold,
    color: COLORS.app_black,
  },
  policyDetails: {
    gap: r(8, "height"),
    marginTop: r(8, "height"),
    paddingTop: r(8, "height"),
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  policyDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: r(10),
  },
  policyDetailDot: {
    width: r(6),
    height: r(6),
    borderRadius: r(3),
    marginTop: r(6),
    flexShrink: 0,
  },
  policyDetailText: {
    fontSize: r(12, "font"),
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: r(18),
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: r(10),
    marginTop: r(14, "height"),
    marginBottom: r(4, "height"),
  },
  modalButton: {
    flex: 1,
    paddingVertical: r(12, "height"),
    borderRadius: r(8),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelActionButton: {
    borderColor: COLORS.border,
  },
  cancelActionButtonText: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS._383838,
  },
  confirmActionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  confirmActionButtonText: {
    fontSize: r(13, "font"),
    fontFamily: FontWeight.SemiBold,
    color: COLORS.black,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CancellationConfirmationModal;
