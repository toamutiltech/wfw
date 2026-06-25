import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useContext(AuthContext);

  // In a real app, you'd fetch this from the /users endpoint
  const displayUser = {
    full_name: user?.name || user?.full_name || 'John Doe',
    username: user?.username || 'johndoe',
    denomination: user?.denomination || 'Non-Denominational',
    location: user?.location || 'Lagos, Nigeria',
    bio: user?.bio || 'Walking by faith, not by sight.',
    favorite_scriptures: user?.favorite_scriptures || 'Psalms 23, John 3:16',
    beliefs: user?.beliefs || 'Saved by Grace.',
    profile_picture: user?.profile_picture || null,
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {displayUser.profile_picture ? (
          <Image source={{ uri: displayUser.profile_picture }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{displayUser.full_name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.name}>{displayUser.full_name}</Text>
        <Text style={styles.username}>@{displayUser.username}</Text>
        <Text style={styles.location}>📍 {displayUser.location}</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.bioText}>{displayUser.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Faith</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Denomination:</Text>
          <Text style={styles.infoValue}>{displayUser.denomination}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Beliefs:</Text>
          <Text style={styles.infoValue}>{displayUser.beliefs}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Favorite Scriptures:</Text>
          <Text style={styles.infoValue}>{displayUser.favorite_scriptures}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationsEnabled ? '#4A90E2' : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFF1F0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFA39E',
  },
  logoutText: {
    color: '#F5222D',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
