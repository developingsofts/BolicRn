import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, DIMENSIONS } from '../config/constants';
import STRINGS from '../config/strings';

interface MessagesScreenProps {
  navigation: any;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation }) => {
  const mockConversations = [
    { id: 1, name: 'Alex', lastMessage: 'Ready for tomorrow\'s workout?', time: '2m ago', unread: 1 },
    { id: 2, name: 'Sarah', lastMessage: 'Great session today!', time: '1h ago', unread: 0 },
    { id: 3, name: 'Mike', lastMessage: 'Can we reschedule?', time: '3h ago', unread: 2 },
    { id: 4, name: 'Emma', lastMessage: 'New PR today!', time: '1d ago', unread: 0 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.MESSAGES.title}</Text>
        <Text style={styles.subtitle}>{STRINGS.MESSAGES.subtitle}</Text>
      </View>

      <ScrollView style={styles.conversationsContainer}>
        {mockConversations.map((conversation) => (
          <TouchableOpacity 
            key={conversation.id} 
            style={styles.conversationCard}
            onPress={() => navigation.navigate('Chat', { 
              partnerId: conversation.id.toString(), 
              partnerName: conversation.name 
            })}
          >
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationName}>{conversation.name}</Text>
              <Text style={styles.conversationTime}>{conversation.time}</Text>
            </View>
            <View style={styles.conversationContent}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
              {conversation.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conversation.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{STRINGS.MESSAGES.footer}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingTop: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  conversationsContainer: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.spacing.lg,
  },
  conversationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.sm,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  conversationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: DIMENSIONS.spacing.sm,
  },
  unreadText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: DIMENSIONS.spacing.lg,
    paddingBottom: DIMENSIONS.spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default MessagesScreen;

