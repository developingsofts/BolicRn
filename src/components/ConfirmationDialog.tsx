import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, DIMENSIONS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const handleCancel = useCallback(() => {
    if (!loading) {
      onCancel();
    }
  }, [loading, onCancel]);

  const handleConfirm = useCallback(() => {
    if (!loading) {
      onConfirm();
    }
  }, [loading, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleCancel} disabled={loading} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={[styles.buttonLabel, styles.cancelLabel]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={[styles.buttonLabel, styles.confirmLabel]}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.lg,
    elevation: 6,
    gap: DIMENSIONS.spacing.sm,
  },
  title: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 18,
    color: COLORS.app_black,
  },
  message: {
    fontFamily: FontWeight.Regular,
    fontSize: 14,
    color: COLORS._5E5E5E,
    lineHeight: 20,
  },
  actions: {
    marginTop: DIMENSIONS.spacing.md,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: DIMENSIONS.spacing.sm,
  },
  button: {
    minWidth: 110,
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.buttonGrayBg,
  },
  confirmButton: {
    backgroundColor: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  cancelLabel: {
    color: COLORS.buttonGrayText,
  },
  confirmLabel: {
    color: COLORS.white,
  },
});

export default ConfirmationDialog;
