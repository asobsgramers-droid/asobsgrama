import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';

export default function DirectChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const profile = useQuery(api.users.getCurrentProfile);
  const messages = useQuery(
    api.messages.getMessages,
    id ? { chatType: 'direct', chatId: id } : 'skip'
  );

  // Get conversation to find other user
  const conversations = useQuery(api.chats.getMyConversations);
  const conversation = conversations?.find((c) => c._id === id);
  const otherUser = conversation?.otherUser;

  const sendMessage = useMutation(api.messages.sendMessage);
  const isBlocked = useQuery(
    api.users.isUserBlocked,
    otherUser?.userId ? { userId: otherUser.userId } : 'skip'
  );
  const blockUser = useMutation(api.users.blockUser);

  const isLoading = messages === undefined || profile === undefined;

  const handleSend = async (content: string) => {
    if (!id) return;
    try {
      await sendMessage({
        chatType: 'direct',
        chatId: id,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!otherUser?.userId) return;
    try {
      await blockUser({ blockedUserId: otherUser.userId });
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        {otherUser ? (
          <TouchableOpacity style={styles.headerProfile} onPress={() => router.push(`/profile/${otherUser.userId}`)}>
            <Avatar name={otherUser.name} size={40} isOnline={otherUser.isOnline} />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: theme.colors.text }]} numberOfLines={1}>
                {otherUser.name}
              </Text>
              <Text style={[styles.headerStatus, { color: otherUser.isOnline ? theme.colors.online : theme.colors.textSecondary }]}>
                {otherUser.isOnline ? 'online' : 'offline'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerProfile}>
            <View style={[styles.placeholderAvatar, { backgroundColor: theme.colors.surfaceSecondary }]} />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: theme.colors.text }]}>Loading...</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.headerButton} onPress={handleBlockUser}>
          <Ionicons
            name={isBlocked ? 'ban' : 'ellipsis-vertical'}
            size={24}
            color={isBlocked ? theme.colors.error : theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : messages && messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MessageBubble
                content={item.content}
                senderName={item.senderName}
                isMine={item.senderId === profile?.userId}
                isDeleted={item.isDeleted}
                isEdited={item.isEdited}
                timestamp={item._creationTime}
              />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No messages yet. Say hello! 👋
            </Text>
          </View>
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          placeholder="Message"
          disabled={!!isBlocked}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 13,
    marginTop: 1,
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});
