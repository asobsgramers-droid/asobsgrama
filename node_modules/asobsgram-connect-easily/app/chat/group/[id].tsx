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
import { Id } from '@/convex/_generated/dataModel';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';

export default function GroupChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const groupId = id as Id<'groups'> | undefined;
  const profile = useQuery(api.users.getCurrentProfile);
  const group = useQuery(api.chats.getGroup, groupId ? { groupId } : 'skip');
  const messages = useQuery(
    api.messages.getMessages,
    id ? { chatType: 'group', chatId: id } : 'skip'
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const leaveGroup = useMutation(api.chats.leaveGroup);

  const isLoading = messages === undefined || profile === undefined || group === undefined;

  const handleSend = async (content: string) => {
    if (!id) return;
    try {
      await sendMessage({
        chatType: 'group',
        chatId: id,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    try {
      await leaveGroup({ groupId });
      router.back();
    } catch (error) {
      console.error('Failed to leave group:', error);
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

        <TouchableOpacity style={styles.headerProfile}>
          <Avatar name={group?.name || 'Group'} size={40} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: theme.colors.text }]} numberOfLines={1}>
              {group?.name || 'Loading...'}
            </Text>
            <Text style={[styles.headerStatus, { color: theme.colors.textSecondary }]}>
              {group?.members.length || 0} members
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={handleLeaveGroup}>
          <Ionicons name="exit-outline" size={24} color={theme.colors.error} />
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
                showSender={item.senderId !== profile?.userId}
              />
            )}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} placeholder="Message" />
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
