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

export default function ChannelChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const channelId = id as Id<'channels'> | undefined;
  const profile = useQuery(api.users.getCurrentProfile);
  const channel = useQuery(api.chats.getChannel, channelId ? { channelId } : 'skip');
  const messages = useQuery(
    api.messages.getMessages,
    id ? { chatType: 'channel', chatId: id } : 'skip'
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const subscribeToChannel = useMutation(api.chats.subscribeToChannel);
  const unsubscribeFromChannel = useMutation(api.chats.unsubscribeFromChannel);

  const isLoading = messages === undefined || profile === undefined || channel === undefined;
  const isAdmin = channel?.isAdmin;
  const isSubscribed = channel?.isSubscribed;

  const handleSend = async (content: string) => {
    if (!id || !isAdmin) return;
    try {
      await sendMessage({
        chatType: 'channel',
        chatId: id,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSubscription = async () => {
    if (!channelId) return;
    try {
      if (isSubscribed) {
        await unsubscribeFromChannel({ channelId });
      } else {
        await subscribeToChannel({ channelId });
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
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

        <View style={styles.headerProfile}>
          <Avatar name={channel?.name || 'Channel'} size={40} color={theme.colors.accent} />
          <View style={styles.headerInfo}>
            <View style={styles.headerNameRow}>
              <Text style={[styles.headerIcon, { color: theme.colors.primary }]}>📢</Text>
              <Text style={[styles.headerName, { color: theme.colors.text }]} numberOfLines={1}>
                {channel?.name || 'Loading...'}
              </Text>
            </View>
            <Text style={[styles.headerStatus, { color: theme.colors.textSecondary }]}>
              {channel?.subscriberCount || 0} subscribers
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { backgroundColor: isSubscribed ? theme.colors.surfaceSecondary : theme.colors.primary },
          ]}
          onPress={handleSubscription}
        >
          <Text
            style={[
              styles.subscribeButtonText,
              { color: isSubscribed ? theme.colors.text : '#FFFFFF' },
            ]}
          >
            {isSubscribed ? 'Joined' : 'Join'}
          </Text>
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
                senderName={channel?.name || 'Channel'}
                isMine={false}
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
            <Ionicons name="megaphone-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No posts yet
            </Text>
          </View>
        )}

        {/* Input (only for admins) */}
        {isAdmin && (
          <ChatInput onSend={handleSend} placeholder="Broadcast a message..." />
        )}

        {!isAdmin && isSubscribed && (
          <View style={[styles.readOnlyBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <Ionicons name="eye-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={[styles.readOnlyText, { color: theme.colors.textSecondary }]}>
              Only admins can post in this channel
            </Text>
          </View>
        )}
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
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIcon: {
    fontSize: 14,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  headerStatus: {
    fontSize: 13,
    marginTop: 1,
  },
  subscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  readOnlyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 14,
  },
});
