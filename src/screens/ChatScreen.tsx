import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "../config/constants";
import STRINGS from "../config/strings";
import { useAuth } from "../contexts/AuthContext";
import FontWeight from "../hooks/useInterFonts";
import { ArrowDown, ImageFile, Send, Like, Close } from "../../assets";
import { TextInput } from "react-native-gesture-handler";

interface ChatScreenProps {
  navigation: any;
  route: any;
}

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  showDateSeparator?: boolean;
  dateSeparator?: string;
  isLiked?: boolean;
}

// Mock messages data
const mockMessages: Message[] = [
  {
    id: "1",
    text: "Hey! How are you?",
    isMe: false,
    timestamp: new Date("2025-02-22T10:30:00"),
    showDateSeparator: true,
    dateSeparator: "22/2/2025",
    isLiked: true,
  },
  {
    id: "2",
    text: "I'm good! Thanks for asking.",
    isMe: true,
    timestamp: new Date("2025-02-22T10:35:00"),
  },
  {
    id: "3",
    text: "Did you finish the workout?",
    isMe: false,
    timestamp: new Date("2025-09-29T14:20:00"),
    showDateSeparator: true,
    dateSeparator: "Yesterday",
  },
  {
    id: "4",
    text: "Yes! It was tough but dsadas dasd sad sad sadsa dad dddsdadsdsadasdasdasdsdassdasdasasdasdasdsadasd worth it 💪",
    isMe: true,
    timestamp: new Date("2025-09-29T14:25:00"),
  },
  {
    id: "5",
    text: "Morning! Ready for today?",
    isMe: false,
    timestamp: new Date("2025-09-30T08:00:00"),
    showDateSeparator: true,
    dateSeparator: "Today",
    isLiked: true,
  },
  {
    id: "6",
    text: "Absolutely! Let's do this 🔥",
    isMe: true,
    timestamp: new Date("2025-09-30T08:05:00"),
  },
    {
    id: "7",
    text: "Absolutely! Let's do this 🔥",
    isMe: true,
    timestamp: new Date("2025-09-30T08:05:00"),
  },
    {
    id: "8",
    text: "Absolutely! Let's do this 🔥",
    isMe: true,
    timestamp: new Date("2025-09-30T08:05:00"),
  },
    {
    id: "9",
    text: "Absolutely! Let's do this 🔥",
    isMe: true,
    timestamp: new Date("2025-09-30T08:05:00"),
  },
    {
    id: "10",
    text: "Absolutely! Let's do this 🔥",
    isMe: true,
    timestamp: new Date("2025-09-30T08:05:00"),
  },

];

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { partnerId, partnerName } = route.params || {};
  const { user } = useAuth();
  const initial = user?.displayName?.charAt(0);
  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Auto-scroll to the latest message on mount
  useEffect(() => {
    if (mockMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={["top","bottom"]} style={styles.container}>
      <View style={[styles.mainContent, { paddingBottom: keyboardHeight }]}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar]}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                </View>
                <Text style={styles.title}>
                  {partnerName ? partnerName : STRINGS.CHAT.defaultTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                  source={Close}
                  style={styles.headerIcon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.messagesWrapper}>
              <FlatList
                ref={flatListRef}
                data={mockMessages}
                keyExtractor={(item) => item.id}
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                directionalLockEnabled={true}
                scrollEventThrottle={16}
                removeClippedSubviews={false}
                maxToRenderPerBatch={20}
                updateCellsBatchingPeriod={30}
                initialNumToRender={20}
                windowSize={10}
                decelerationRate={0.98}
                bounces={true}
                alwaysBounceVertical={true}
                overScrollMode="always"
                disableScrollViewPanResponder={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
                ListFooterComponent={<View style={{ height: 20 }} />}
                renderItem={({ item }) => (
                  <View>
                    {item.showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateSeparatorLine} />
                        <Text style={styles.dateSeparatorText}>
                          {item.dateSeparator}
                        </Text>
                        <View style={styles.dateSeparatorLine} />
                      </View>
                    )}
                    <View style={[
                      styles.messageRow,
                     
                    ]}>
                      <View
                        style={[
                          styles.messageContainer,
                          item.isMe ? styles.myMessage : styles.theirMessage,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            item.isMe
                              ? styles.myMessageText
                              : styles.theirMessageText,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </View>
                      {!item.isMe && item.isLiked && (
                        <Image
                          source={Like}
                          style={styles.likeIcon}
                        />
                      )}
                    </View>
                  </View>
                )}
              />
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder={STRINGS.CHAT.placeholder}
                    placeholderTextColor={COLORS.gradient1}
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      // handle image upload
                    }}
                    style={styles.imageButton}
                  >
                    <Image
                      source={ImageFile}
                      style={styles.imageIcon}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // handle send message
                  }}
                  style={styles.sendButton}
                >
                  <Image
                    source={Send}
                    style={styles.sendIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gradient3,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontFamily: FontWeight.SemiBold,
    fontSize: 18,
    color: COLORS.white,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: DIMENSIONS.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: "center",
  },
  comingSoon: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.gradient3,
  },
  headerLeft: {
    flexDirection: "row",
    gap: DIMENSIONS.spacing.md,
    alignItems: "center",
  },
  avatarContainer: {
    borderRadius: 100,
    height: 52,
    width: 52,
    borderColor: COLORS.white,
  },
  headerIcon: {
    width: 24,
    height: 24,
    marginTop:-10,
    tintColor: COLORS.white,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.primary,
    marginRight: DIMENSIONS.spacing.md,
  },
  messagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesWrapper: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.white,
    paddingVertical: DIMENSIONS.spacing.lg,
  },
  flatList: {
    flex: 1,
    backgroundColor: COLORS.chatMessageListBg,
    borderRadius: 20,
    paddingBottom: DIMENSIONS.spacing.md,
    overflow: 'hidden',
  },
  flatListContent: {
    padding: DIMENSIONS.spacing.md,
    paddingBottom: 30,
    flexGrow: 1,
  },
  placeholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  // Message styles
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.md,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.chatDateSeparatorLine,
  },
  dateSeparatorText: {
    marginHorizontal: DIMENSIONS.spacing.md,
    fontSize: 14,
    color: COLORS.chatDateSeparatorText,
    fontWeight: "500",
    fontFamily: FontWeight.Medium,
  },
  messageContainer: {
    maxWidth: 300,
    minHeight: 33,
    paddingTop: 5.5,

    paddingRight: 12,
    paddingBottom: 5.5,
    paddingLeft: 12,
    borderRadius: 9,
    // marginTop: DIMENSIONS.spacing.lg,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: DIMENSIONS.spacing.lg,
    justifyContent: "space-between",
  },

  likeIcon: {
    width: 16,
    height: 16,
    tintColor: COLORS.text,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.chatReceiverBg,
  },
  messageText: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: FontWeight.Regular,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  inputContainer: {
    backgroundColor: COLORS.gradient3,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DIMENSIONS.spacing.sm,
  },
  inputWrapper: {
    position: "relative",
    flex: 1,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    color: COLORS.black,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
    paddingTop: 5.5,
    paddingRight: 40,
    paddingBottom: 5.5,
    paddingLeft: 12,
    height: 45,
  },
  imageButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  imageIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.gradient1,
  },
  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.gradient1,
  },
});

export default ChatScreen;
