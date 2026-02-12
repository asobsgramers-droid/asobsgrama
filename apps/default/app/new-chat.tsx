import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';

export default function NewChatScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : 'skip'
  );

  const getOrCreateConversation = useMutation(api.chats.getOrCreateConversation);

  const handleUserPress = async (userId: string) => {
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: userId });
      router.replace(`/chat/direct/${conversationId}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = isSearching && searchResults === undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>New Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by name or username"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push('/new-group')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="people" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
            New Group
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.push('/new-channel')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="megaphone" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
            New Channel
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : isSearching ? (
        searchResults && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => handleUserPress(item.userId)}
              >
                <Avatar name={item.name} size={50} isOnline={item.isOnline} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  {item.username && (
                    <Text style={[styles.userUsername, { color: theme.colors.textSecondary }]}>
                      @{item.username}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No users found
            </Text>
          </View>
        )
      ) : (
        <View style={styles.hintContainer}>
          <Ionicons name="search-outline" size={48} color={theme.colors.textTertiary} />
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            Search for someone to start chatting
          </Text>
        </View>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  quickActions: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 14,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hintText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});
