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

/**
 * Server-supplied refund quote. Every field is optional: only what the backend
 * actually returns is rendered. Nothing here is ever computed client-side —
 * fees, net amounts and arrival windows are financial terms and must come from
 * the payment provider via the API.
 */
export interface RefundQuote {
  /** Amount originally charged for the session. */
  amount?: number | null;
  /** Processing/cancellation fee withheld, as a positive number. */
  fee?: number | null;
  /** Net amount that will actually be refunded. */
  net?: number | null;
  /** Human-readable expected arrival window, e.g. "Mar 3 - Mar 7". */
  eta?: string | null;
  /** ISO currency code, e.g. "USD". Defaults to a "$" prefix when absent. */
  currency?: string | null;
  /** Cancellation-policy text as authored by the backend. */
  policyText?: string | null;
}

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
  /**
   * Real refund breakdown from the server. When omitted (the current state of
   * the backend) the modal shows only the amount paid plus an honest
   * "confirmed by the payment provider" note — never invented numbers.
   */
  refundQuote?: RefundQuote | null;
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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
  refundQuote = null,
}) => {
  const labels = STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundLabels;

  const currencyPrefix = refundQuote?.currency
    ? `${refundQuote.currency} `
    : "$";

  const formatAmount = (value: number) =>
    `${currencyPrefix}${value.toFixed(2)}`;

  // Amount paid comes from the booking record itself; it is a recorded charge,
  // not a projection.
  const paidAmount = isNumber(refundQuote?.amount)
    ? refundQuote.amount
    : isNumber(booking?.price?.price)
    ? booking!.price.price
    : null;

  const fee = isNumber(refundQuote?.fee) ? refundQuote.fee : null;
  const netRefund = isNumber(refundQuote?.net) ? refundQuote.net : null;
  const eta = refundQuote?.eta || null;
  const policyText = refundQuote?.policyText || null;

  const hasServerBreakdown = fee !== null || netRefund !== null;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isLoading) onClose();
      }}
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
                {hasServerBreakdown
                  ? STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundTerms
                  : STRINGS.SCHEDULED_SESSIONS.cancellationModal.paymentSummary}
              </Text>

              {paidAmount !== null && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>{labels.sessionAmount}</Text>
                  <Text style={styles.amountValue}>
                    {formatAmount(paidAmount)}
                  </Text>
                </View>
              )}

              {fee !== null && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>{labels.processingFee}</Text>
                  <Text style={[styles.amountValue, styles.feeAmount]}>
                    -{formatAmount(Math.abs(fee))}
                  </Text>
                </View>
              )}

              {netRefund !== null && (
                <>
                  <View style={styles.divider} />
                  <View style={[styles.amountRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>
                      {labels.refundableAmount}
                    </Text>
                    <Text style={styles.totalAmount}>
                      {formatAmount(netRefund)}
                    </Text>
                  </View>
                </>
              )}

              {!!eta && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    {labels.expectedArrival}
                  </Text>
                  <Text style={styles.amountValue}>{eta}</Text>
                </View>
              )}

              <View style={styles.policyDetails}>
                <Text style={styles.policyDetailText}>
                  {policyText ||
                    STRINGS.SCHEDULED_SESSIONS.cancellationModal.refundPending}
                </Text>
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
                onPress={handleConfirm}
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
    color: COLORS.error,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
