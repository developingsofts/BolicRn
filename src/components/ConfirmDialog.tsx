import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "../config/constants";
import FontWeight from "../hooks/useInterFonts";
import { Ionicons } from "@expo/vector-icons";

interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Delete Session",
  description = "Once session is deleted, your upcoming applications for the session will be cancelled and users will be notified.",
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmBtn]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteBtn]}
              onPress={onClose}
            >
              <Text style={styles.deleteText}>{cancelText}</Text>
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
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialog: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    textAlign: "left",
    maxWidth: 400,
    elevation: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.gradient1,
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontFamily: FontWeight.Medium,
    color: COLORS._5E5E5E,
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.white,
  },
  deleteText: {
    color: COLORS.white,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  confirmText: {
    color: COLORS._EB3434,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
});

export default ConfirmDialog;
