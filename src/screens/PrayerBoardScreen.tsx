import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function PrayerBoardScreen() {
  const { user } = useContext(AuthContext);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrayers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        pollForUpdates();
      }, 30000);
      return () => clearInterval(interval);
    }, [prayers])
  );

  const pollForUpdates = async () => {
    try {
      const response = await client.get('/prayers.php');
      const freshPrayers = response.data.prayers || [];
      if (freshPrayers.length > 0 && prayers.length > 0) {
        if (freshPrayers[0].id !== prayers[0].id || freshPrayers.length !== prayers.length) {
          setPrayers(freshPrayers);
        }
      } else if (freshPrayers.length !== prayers.length) {
        setPrayers(freshPrayers);
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const fetchPrayers = async () => {
    try {
      const response = await client.get('/prayers.php');
      setPrayers(response.data.prayers || []);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrayers();
    setRefreshing(false);
  };

  const handlePrayForThis = async (prayerId: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please log in to interact with prayers.');
      return;
    }
    
    // Optimistic UI Update
    setPrayers(currentPrayers => currentPrayers.map(p => {
      if (p.id === prayerId) {
        return { ...p, prayed_count: (parseInt(p.prayed_count) || 0) + 1 };
      }
      return p;
    }));
    
    try {
      await client.post('/prayers.php?action=interact', {
        prayer_id: prayerId,
        user_id: user.id,
      });
      // Re-fetch quietly to ensure data consistency
      fetchPrayers(); 
    } catch (error) {
      // If error (e.g. already prayed), fetch true state
      fetchPrayers();
    }
  };

  const handleSubmitPrayer = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert('Missing Info', 'Please enter both a title and a description.');
      return;
    }
    
    setSubmitting(true);
    try {
      await client.post('/prayers.php?action=create', {
        title: newTitle,
        description: newDescription,
        user_id: user?.id,
      });
      
      Alert.alert('Success', 'Your prayer request has been shared.');
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      fetchPrayers();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit prayer request.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.author}>Posted by: {item.author_name || item.username || 'Anonymous'}</Text>
        
        <View style={styles.actionRow}>
          <Text style={styles.countText}>Prayed for {item.prayed_count ? item.prayed_count : 0} times</Text>
          <TouchableOpacity 
            style={styles.prayButton} 
            onPress={() => handlePrayForThis(item.id)}
          >
            <Text style={styles.prayButtonText}>🙏 I Prayed For This</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.header}>Prayer Board</Text>
      </View>

      {loading && prayers.length === 0 ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No prayer requests yet.</Text>}
          contentContainerStyle={{ paddingBottom: 80 }} // Space for FAB
        />
      )}

      {/* Floating Action Button */}
      {user && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* New Prayer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Prayer Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Title (e.g., Healing for a friend)"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your request..."
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmitPrayer}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F5F5' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  card: {
    backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: '#4A90E2', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  description: { fontSize: 16, color: '#444', marginTop: 8 },
  footer: { marginTop: 12 },
  author: { fontSize: 12, color: '#888', marginBottom: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  countText: { fontSize: 12, color: '#666' },
  prayButton: { backgroundColor: '#E8F4F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  prayButtonText: { color: '#007AFF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 20 },
  
  // FAB Styles
  fab: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 20, bottom: 20, backgroundColor: '#4A90E2', borderRadius: 30,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    minHeight: 350
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  input: {
    backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0',
    fontSize: 16, marginBottom: 15
  },
  textArea: { minHeight: 100 },
  submitButton: {
    backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10
  },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
