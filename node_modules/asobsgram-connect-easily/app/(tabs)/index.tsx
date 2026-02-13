import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { ChatListItem } from '@/components/ChatListItem';

export default function ChatsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const conversations = useQuery(api.chats.getMyConversations);
  const groups = useQuery(api.chats.getMyGroups);

  const isLoading = conversations === undefined || groups === undefined;

  // Combine and sort all chats
  const allChats = React.useMemo(() => {
    if (!conversations || !groups) return [];

    const convChats = conversations.map((c) => ({
      id: c._id,
      type: 'direct' as const,
      name: c.otherUser?.name || 'Unknown',
      lastMessage: c.lastMessagePreview,
      time: c.lastMessageAt,
      isOnline: c.otherUser?.isOnline,
      unreadCount: c.unreadCount,
    }));

    const groupChats = groups.map((g) => ({
      id: g._id,
      type: 'group' as const,
      name: g.name,
      lastMessage: g.lastMessagePreview,
      time: g.lastMessageAt,
      memberCount: g.memberCount,
    }));

    return [...convChats, ...groupChats].sort((a, b) => b.time - a.time);
  }, [conversations, groups]);

  const handleChatPress = (chat: (typeof allChats)[0]) => {
    if (chat.type === 'direct') {
      router.push(`/chat/direct/${chat.id}`);
    } else {
      router.push(`/chat/group/${chat.id}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Chats</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/new-chat')}
          >
            <Ionicons name="create-outline" size={26} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : allChats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No chats yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Start a conversation with someone
          </Text>
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/new-chat')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              name={item.name}
              lastMessage={item.lastMessage}
              time={item.time}
              unreadCount={item.type === 'direct' ? item.unreadCount : undefined}
              isOnline={item.type === 'direct' ? item.isOnline : undefined}
              isGroup={item.type === 'group'}
              memberCount={item.type === 'group' ? item.memberCount : undefined}
              onPress={() => handleChatPress(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 0.5,
    marginLeft: 84,
  },
});
