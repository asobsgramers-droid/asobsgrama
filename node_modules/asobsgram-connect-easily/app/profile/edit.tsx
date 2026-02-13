import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const profile = useQuery(api.users.getCurrentProfile);
  const updateProfile = useMutation(api.users.createOrUpdateProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateAvatar = useMutation(api.storage.updateAvatar);
  const removeAvatar = useMutation(api.storage.removeAvatar);
  const getFileUrl = useQuery(
    api.storage.getFileUrl,
    profile?.avatarId ? { storageId: profile.avatarId } : "skip"
  );
  
  // Phone verification
  const sendVerificationCode = useAction(api.phoneVerification.sendVerificationCode);
  const verifyCode = useAction(api.phoneVerification.verifyCode);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Phone verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePickImage = async () => {
    triggerHaptic();
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    triggerHaptic();
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('Permission Required', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Fetch the image as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type,
        },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Update profile with new avatar
      await updateAvatar({ storageId });
      
      triggerHaptic();
    } catch (error) {
      console.error('Failed to upload image:', error);
      showAlert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    triggerHaptic();
    try {
      await removeAvatar();
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!phone.trim()) {
      showAlert('Error', 'Please enter a phone number first.');
      return;
    }

    if (!profile) return;

    setVerificationLoading(true);
    setPendingPhone(phone.trim());
    
    try {
      const result = await sendVerificationCode({
        userId: profile.userId,
        phone: phone.trim(),
      });
      
      setVerificationMessage(result.message);
      
      if (result.success) {
        setShowVerificationModal(true);
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      console.error('Failed to send verification code:', error);
      showAlert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || !profile) return;

    setVerificationLoading(true);
    try {
      const result = await verifyCode({
        userId: profile.userId,
        code: verificationCode.trim(),
      });

      if (result.success) {
        triggerHaptic();
        setShowVerificationModal(false);
        setVerificationCode('');
        showAlert('Success', 'Phone number verified successfully!');
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
      showAlert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        email: profile?.email,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim().length > 0;

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: isValid ? theme.colors.primary : theme.colors.surfaceSecondary },
          ]}
          onPress={handleSave}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                { color: isValid ? '#FFFFFF' : theme.colors.textTertiary },
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setShowPhotoOptions(true)} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <View style={[styles.avatarLoading, { backgroundColor: theme.colors.surfaceSecondary }]}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
              </View>
            ) : getFileUrl ? (
              <Image
                source={{ uri: getFileUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Avatar name={name || 'User'} size={100} />
            )}
            <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.changePhotoButton, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={() => setShowPhotoOptions(true)}
            disabled={uploadingPhoto}
          >
            <Ionicons name="camera-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
              ]}
              placeholder="Your name"
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Username</Text>
            <View
              style={[
                styles.usernameInput,
                { backgroundColor: theme.colors.surfaceSecondary },
              ]}
            >
              <Text style={[styles.usernamePrefix, { color: theme.colors.textSecondary }]}>@</Text>
              <TextInput
                style={[styles.usernameField, { color: theme.colors.text }]}
                placeholder="username"
                placeholderTextColor={theme.colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Bio</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
              ]}
              placeholder="Tell something about yourself"
              placeholderTextColor={theme.colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.phoneHeader}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
              {profile?.phoneVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.phoneInput,
                  { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
                ]}
                placeholder="+1 234 567 8900"
                placeholderTextColor={theme.colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { 
                    backgroundColor: theme.colors.primary,
                    opacity: verificationLoading || !phone.trim() ? 0.6 : 1,
                  },
                ]}
                onPress={handleSendVerificationCode}
                disabled={verificationLoading || !phone.trim()}
              >
                {verificationLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {profile?.phoneVerified ? 'Re-verify' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.phoneHint, { color: theme.colors.textTertiary }]}>
              Include country code (e.g., +1 for US)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoOptions(false)}
        >
          <View style={[styles.photoOptionsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.photoOptionsTitle, { color: theme.colors.text }]}>
              Profile Photo
            </Text>
            
            <TouchableOpacity
              style={[styles.photoOption, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setShowPhotoOptions(false);
                handleTakePhoto();
              }}
            >
              <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.photoOptionText, { color: theme.colors.text }]}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoOption, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setShowPhotoOptions(false);
                handlePickImage();
              }}
            >
              <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.photoOptionText, { color: theme.colors.text }]}>
                Choose from Library
              </Text>
            </TouchableOpacity>

            {profile?.avatarId && (
              <TouchableOpacity
                style={styles.photoOption}
                onPress={() => {
                  setShowPhotoOptions(false);
                  handleRemovePhoto();
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={[styles.photoOptionText, { color: '#FF3B30' }]}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceSecondary }]}
              onPress={() => setShowPhotoOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Verification Code Modal */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVerificationModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.verificationModal, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.verificationHeader}>
                <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.primary} />
                <Text style={[styles.verificationTitle, { color: theme.colors.text }]}>
                  Verify Phone Number
                </Text>
                <Text style={[styles.verificationSubtitle, { color: theme.colors.textSecondary }]}>
                  Enter the 6-digit code sent to {pendingPhone}
                </Text>
              </View>

              {verificationMessage && (
                <View style={[styles.messageBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <Text style={[styles.messageText, { color: theme.colors.textSecondary }]}>
                    {verificationMessage}
                  </Text>
                </View>
              )}

              <TextInput
                style={[
                  styles.codeInput,
                  { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
                ]}
                placeholder="000000"
                placeholderTextColor={theme.colors.textTertiary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />

              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[styles.resendButton, { borderColor: theme.colors.border }]}
                  onPress={handleSendVerificationCode}
                  disabled={verificationLoading}
                >
                  <Text style={[styles.resendButtonText, { color: theme.colors.primary }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.verifyCodeButton,
                    { 
                      backgroundColor: theme.colors.primary,
                      opacity: verificationCode.length !== 6 || verificationLoading ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || verificationLoading}
                >
                  {verificationLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyCodeButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text style={[styles.closeModalText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 17,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {},
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
  usernameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  usernameField: {
    flex: 1,
    fontSize: 16,
  },
  phoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34C759',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  phoneInput: {
    flex: 1,
  },
  verifyButton: {
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneHint: {
    fontSize: 12,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoOptionsContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
  },
  photoOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    gap: 16,
  },
  photoOptionText: {
    fontSize: 17,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  verificationModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
  },
  verificationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  verificationSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 13,
    textAlign: 'center',
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 12,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  resendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifyCodeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  verifyCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeModalButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 15,
  },
});
