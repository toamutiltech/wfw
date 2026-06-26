import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen({ navigation }: any) {
  const { user, login, updateUser } = useContext(AuthContext); 
  
  const [fullName, setFullName] = useState(user?.name || user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [denomination, setDenomination] = useState(user?.denomination || '');
  const [beliefs, setBeliefs] = useState(user?.beliefs || '');
  const [favoriteScriptures, setFavoriteScriptures] = useState(user?.favorite_scriptures || '');
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.profile_picture || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('id', user.id);
      formData.append('full_name', fullName);
      formData.append('bio', bio);
      formData.append('location', location);
      formData.append('denomination', denomination);
      formData.append('beliefs', beliefs);
      formData.append('favorite_scriptures', favoriteScriptures);

      if (profileImage && profileImage !== user.profile_picture) {
        const localUri = profileImage;
        const filename = localUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        // @ts-ignore
        formData.append('profile_picture', { uri: localUri, name: filename, type });
      }

      const response = await client.post('/users.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully!');
        
        // Update context state and local storage immediately after success
        const updatedUser = { ...user, name: fullName, full_name: fullName, bio, location, denomination, beliefs, favorite_scriptures: favoriteScriptures };
        if (profileImage) updatedUser.profile_picture = profileImage;
        await updateUser(updatedUser);
        
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to sync profile update with server.');
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      Alert.alert('Error', 'Network error while syncing profile update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
          )}
          <View style={styles.editIconBadge}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHelpText}>Tap to change photo</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="John Doe" />

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Walking by faith..." multiline />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" />

        <Text style={styles.label}>Denomination</Text>
        <TextInput style={styles.input} value={denomination} onChangeText={setDenomination} placeholder="e.g. Non-Denominational" />

        <Text style={styles.label}>Beliefs</Text>
        <TextInput style={styles.input} value={beliefs} onChangeText={setBeliefs} placeholder="Core beliefs..." />

        <Text style={styles.label}>Favorite Scriptures</Text>
        <TextInput style={styles.input} value={favoriteScriptures} onChangeText={setFavoriteScriptures} placeholder="e.g. John 3:16" />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#4A90E2', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48, color: '#FFF', fontWeight: 'bold' },
  editIconBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#4A90E2', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  avatarHelpText: { marginTop: 10, color: '#888', fontSize: 14 },
  formSection: { padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16, marginBottom: 20 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
