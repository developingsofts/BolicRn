import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../config/constants';

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
  title = 'Delete Session',
  description = 'Once session is deleted, your upcoming applications for the session will be cancelled and users will be notified.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.button, styles.confirmBtn]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteBtn]} onPress={onClose}>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 24,
    width: '85%',
    textAlign: 'left',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.white,
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  confirmText: {
    color: '#EB3434',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ConfirmDialog;
