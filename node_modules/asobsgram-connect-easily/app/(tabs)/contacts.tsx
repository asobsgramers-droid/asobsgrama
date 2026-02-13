import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';

export default function ContactsScreen() {
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
      router.push(`/chat/direct/${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const isSearching = searchQuery.trim().length >= 2;
  const isLoading = isSearching && searchResults === undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Contacts</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search people"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Quick Actions */}
      {!isSearching && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={() => router.push('/new-group')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="people" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              New Group
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={() => router.push('/new-channel')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.accent }]}>
              <Ionicons name="megaphone" size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              New Channel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Results or Hint */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : isSearching ? (
        searchResults && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleUserPress(item.userId)}
              >
                <Avatar name={item.name} size={50} isOnline={item.isOnline} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  {item.username && (
                    <Text style={[styles.contactUsername, { color: theme.colors.textSecondary }]}>
                      @{item.username}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No users found
            </Text>
          </View>
        )
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.hintTitle, { color: theme.colors.text }]}>Find People</Text>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            Search by name or username to find people and start a conversation
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hintTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  hintText: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '500',
  },
  contactUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    marginLeft: 80,
  },
});
