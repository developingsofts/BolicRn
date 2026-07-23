import React, { useState, useEffect } from 'react';
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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import { useAndroidNavBar } from '../hooks/useAndroidNavBar';
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
  const { height: navBarHeight } = useAndroidNavBar();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHide = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={isKeyboardVisible ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        style={styles.editPostModalContainer}
        enabled={isKeyboardVisible}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.editPostModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.editPostModalContent, { paddingBottom: !isKeyboardVisible ? DIMENSIONS.spacing.lg + navBarHeight : DIMENSIONS.spacing.lg }]}>
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
                      <ActivityIndicator size="small" color={COLORS.black} />
                    ) : (
                      <Text style={styles.editPostSaveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  editPostModalContainer: {
    flex: 1,
  },
  editPostModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editPostModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: DIMENSIONS.spacing.lg,
    maxHeight: '70%',
    paddingBottom: DIMENSIONS.spacing.lg,
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
    justifyContent: 'space-between',
    marginTop: DIMENSIONS.spacing.lg,
  },
  editPostCancelButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: 'center',
    marginRight: DIMENSIONS.spacing.sm,
  },
  editPostCancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FontWeight.Medium,
  },
  editPostSaveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: DIMENSIONS.spacing.md,
    alignItems: 'center',
    marginLeft: DIMENSIONS.spacing.sm,
  },
  editPostSaveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  editPostSaveButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
  },
});

export default EditPostModal;