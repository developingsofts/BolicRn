import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editText: string;
  onChangeText: (text: string) => void;
  isUpdating: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  onClose,
  onSave,
  editText,
  onChangeText,
  isUpdating,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.editPostModalContainer}
      >
        <TouchableOpacity
          style={styles.editPostModalOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.editPostModalContent}>
          <View style={styles.editPostModalHeader}>
            <Text style={styles.editPostModalTitle}>Edit Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.editPostModalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.editPostInput}
            value={editText}
            onChangeText={onChangeText}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            autoFocus
            maxLength={500}
          />

          <View style={styles.editPostModalActions}>
            <TouchableOpacity
              style={styles.editPostCancelButton}
              onPress={onClose}
            >
              <Text style={styles.editPostCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.editPostSaveButton,
                (!editText.trim() || isUpdating) && styles.editPostSaveButtonDisabled
              ]}
              onPress={onSave}
              disabled={!editText.trim() || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.editPostSaveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  editPostModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editPostModalOverlay: {
    flex: 1,
  },
  editPostModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: DIMENSIONS.spacing.lg,
    maxHeight: '70%',
  },
  editPostModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalTitle: {
    fontSize: 18,
    fontFamily: FontWeight.Bold,
    color: COLORS.text,
  },
  editPostModalClose: {
    fontSize: 18,
    color: COLORS.textSecondary,
    padding: DIMENSIONS.spacing.xs,
  },
  editPostInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: DIMENSIONS.spacing.md,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    maxHeight: 300,
    textAlignVertical: 'top',
    marginBottom: DIMENSIONS.spacing.lg,
  },
  editPostModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DIMENSIONS.spacing.md,
  },
  editPostCancelButton: {
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editPostCancelButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.Medium,
    color: COLORS.textSecondary,
  },
  editPostSaveButton: {
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.xl,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  editPostSaveButtonDisabled: {
    opacity: 0.5,
  },
  editPostSaveButtonText: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.white,
  },
});

export default EditPostModal;