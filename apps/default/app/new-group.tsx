import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';

export default function NewGroupScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<'members' | 'details'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : 'skip'
  );

  const createGroup = useMutation(api.chats.createGroup);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      const groupId = await createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers,
      });
      router.replace(`/chat/group/${groupId}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSearching = searchQuery.trim().length >= 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step === 'details' ? setStep('members') : router.back())}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {step === 'members' ? 'Add Members' : 'New Group'}
        </Text>
        {step === 'members' ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setStep('details')}
          >
            <Text style={[styles.nextButtonText, { color: theme.colors.primary }]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: groupName.trim()
                  ? theme.colors.primary
                  : theme.colors.surfaceSecondary,
              },
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  { color: groupName.trim() ? '#FFFFFF' : theme.colors.textTertiary },
                ]}
              >
                Create
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {step === 'members' ? (
        <>
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search people to add"
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={[styles.selectedLabel, { color: theme.colors.textSecondary }]}>
                {selectedMembers.length} selected
              </Text>
            </View>
          )}

          {/* Results */}
          {isSearching && searchResults ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedMembers.includes(item.userId);
                return (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => toggleMember(item.userId)}
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
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : 'transparent',
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={styles.hintContainer}>
              <Ionicons name="people-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
                Search for people to add to your group
              </Text>
            </View>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.detailsContainer}>
          {/* Group Avatar Placeholder */}
          <View style={styles.avatarSection}>
            <View style={[styles.groupAvatar, { backgroundColor: theme.colors.surfaceSecondary }]}>
              <Ionicons name="camera" size={32} color={theme.colors.textTertiary} />
            </View>
          </View>

          {/* Group Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Group Name
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
              ]}
              placeholder="Enter group name"
              placeholderTextColor={theme.colors.textTertiary}
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
              ]}
              placeholder="What's this group about?"
              placeholderTextColor={theme.colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Members Count */}
          <View style={[styles.membersInfo, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="people" size={22} color={theme.colors.primary} />
            <Text style={[styles.membersInfoText, { color: theme.colors.text }]}>
              {selectedMembers.length + 1} members (including you)
            </Text>
          </View>
        </ScrollView>
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
  nextButton: {
    padding: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 15,
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
  selectedSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  detailsContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  membersInfoText: {
    fontSize: 16,
  },
});
