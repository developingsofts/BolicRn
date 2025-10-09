import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import { Close } from '../../assets';
import FontWeight from '../hooks/useInterFonts';

interface PaymentOptionsDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirmPayment: (paymentMethod: string) => void;
  amount: number;
  remainingSessions?: number;
}

const PaymentOptionsDialog: React.FC<PaymentOptionsDialogProps> = ({
  visible,
  onClose,
  onConfirmPayment,
  amount,
  remainingSessions = 2,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<string>('credit');

  const handleConfirm = () => {
    onConfirmPayment(selectedPayment);
  };

  const renderRadioOption = (
    value: string,
    id: string,
    title: string,
    subtitle?: string,
    isHighlighted?: boolean
  ) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.radioOption,
        isHighlighted && styles.radioOptionHighlighted,
        selectedPayment === value && styles.radioOptionSelected,
      ]}
      onPress={() => setSelectedPayment(value)}
      activeOpacity={0.7}
    >
      <View style={styles.radioButton}>
        {selectedPayment === value && <View style={styles.radioButtonInner} />}
      </View>
      <View style={styles.radioContent}>
        <Text style={[styles.radioTitle, isHighlighted && styles.radioTitleHighlighted]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.radioSubtitle}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dialogContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Payment Options</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Options */}
            <View style={styles.optionsContainer}>
              {renderRadioOption(
                'credit',
                'credit',
                'Subscription Credit',
                `${remainingSessions} sessions remaining`,
                true
              )}
              {renderRadioOption(
                'apple',
                'apple',
                'Apple Pay'
              )}
              {renderRadioOption(
                'card',
                'card',
                'Credit/Debit Card'
              )}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                Confirm and Pay ${amount}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  dialogContent: {
    padding: DIMENSIONS.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  closeButton: {
    padding: DIMENSIONS.spacing.xs,
  },
  closeIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  optionsContainer: {
    gap: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.xl,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: DIMENSIONS.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  radioOptionHighlighted: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  radioOptionSelected: {
    borderColor: COLORS.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioContent: {
    flex: 1,
    marginLeft: DIMENSIONS.spacing.md,
  },
  radioTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  radioTitleHighlighted: {
    color: COLORS.text,
  },
  radioSubtitle: {
    fontSize: 14,
    fontFamily: FontWeight.Regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: DIMENSIONS.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
});

export default PaymentOptionsDialog;
