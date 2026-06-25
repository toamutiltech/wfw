import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, Image, Modal, TextInput, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [readingModalVisible, setReadingModalVisible] = useState(false);
  const [selectedDevotional, setSelectedDevotional] = useState<any>(null);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newScripture, setNewScripture] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevotionals();
  }, [user]); // Re-fetch if user changes to get correct like status

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        pollForUpdates();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }, [devotionals])
  );

  const pollForUpdates = async () => {
    try {
      const response = await client.get(`/devotionals.php${user ? `?user_id=${user.id}` : ''}`);
      const freshDevotionals = response.data.devotionals || [];
      
      // Auto update silently
      if (freshDevotionals.length !== devotionals.length || (freshDevotionals.length > 0 && devotionals.length > 0 && freshDevotionals[0].id !== devotionals[0].id)) {
        setDevotionals(freshDevotionals);
        AsyncStorage.setItem('cached_devotionals', JSON.stringify(freshDevotionals));
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const fetchDevotionals = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cached_devotionals');
      if (cachedData && devotionals.length === 0) {
        setDevotionals(JSON.parse(cachedData));
      }
      
      const response = await client.get(`/devotionals.php${user ? `?user_id=${user.id}` : ''}`);
      const freshDevotionals = response.data.devotionals || [];
      
      setDevotionals(freshDevotionals);
      await AsyncStorage.setItem('cached_devotionals', JSON.stringify(freshDevotionals));
      
    } catch (error) {
      console.error('Error fetching devotionals:', error);
      if (devotionals.length === 0) {
        Alert.alert('Offline', 'Unable to fetch devotionals. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevotionals();
    setRefreshing(false);
  };

  const handleLike = async (id: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please log in to like devotionals.');
      return;
    }
    
    // Optimistic UI Update
    setDevotionals(current => current.map(d => {
      if (d.id === id) {
        const isLiked = parseInt(d.user_liked) > 0;
        return { 
          ...d, 
          likes_count: isLiked ? parseInt(d.likes_count) - 1 : parseInt(d.likes_count) + 1,
          user_liked: isLiked ? 0 : 1
        };
      }
      return d;
    }));

    try {
      await client.post('/devotionals.php?action=like', { devotional_id: id, user_id: user.id });
      // pollForUpdates(); // silent sync
    } catch (error) {
      fetchDevotionals(); // Revert on fail
    }
  };

  const handleBookmark = async (id: number) => {
    if (!user) return;
    
    // Optimistic UI Update
    setDevotionals(current => current.map(d => {
      if (d.id === id) {
        const isBookmarked = parseInt(d.user_bookmarked) > 0;
        return { ...d, user_bookmarked: isBookmarked ? 0 : 1 };
      }
      return d;
    }));

    try {
      await client.post('/devotionals.php?action=bookmark', { devotional_id: id, user_id: user.id });
    } catch (error) {
      fetchDevotionals();
    }
  };

  const handleCreateDevotional = async () => {
    if (!newTitle.trim() || !newScripture.trim() || !newContent.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await client.post('/devotionals.php?action=create', {
        title: newTitle,
        scripture: newScripture,
        content: newContent,
        author_id: user.id
      });
      Alert.alert('Success', 'Devotional posted successfully.');
      setCreateModalVisible(false);
      setNewTitle('');
      setNewScripture('');
      setNewContent('');
      fetchDevotionals();
    } catch (error) {
      Alert.alert('Error', 'Failed to create devotional.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReadingView = (devotional: any) => {
    setSelectedDevotional(devotional);
    setReadingModalVisible(true);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const isFeatured = index === 0;
    const isLiked = parseInt(item.user_liked) > 0;
    const isBookmarked = parseInt(item.user_bookmarked) > 0;

    if (isFeatured) {
      return (
        <TouchableOpacity style={styles.featuredCard} onPress={() => openReadingView(item)} activeOpacity={0.9}>
          <Image source={require('../../assets/images/splash.png')} style={styles.featuredImage} blurRadius={3} />
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredBadge}>DAILY WORD</Text>
            <Text style={styles.featuredTitle}>{item.title}</Text>
            <Text style={styles.featuredScripture}>{item.scripture}</Text>
            
            <View style={styles.interactionRow}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.interactionBtn}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#E74C3C" : "#FFF"} />
                <Text style={styles.interactionTextWhite}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleBookmark(item.id)} style={styles.interactionBtn}>
                <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={24} color={isBookmarked ? "#F1C40F" : "#FFF"} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.card} onPress={() => openReadingView(item)} activeOpacity={0.7}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.scripture}>{item.scripture}</Text>
        <Text style={styles.contentPreview} numberOfLines={2}>{item.content}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.author}>By {item.author_name || 'Anonymous'}</Text>
          <View style={styles.interactionRow}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.interactionBtn}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#E74C3C" : "#888"} />
                <Text style={styles.interactionText}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleBookmark(item.id)} style={[styles.interactionBtn, {marginLeft: 15}]}>
                <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={20} color={isBookmarked ? "#F1C40F" : "#888"} />
              </TouchableOpacity>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.header}>Devotionals</Text>
      </View>

      {loading && devotionals.length === 0 ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={devotionals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />}
          ListEmptyComponent={<Text style={styles.empty}>No devotionals available.</Text>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB for Admins/Authors */}
      {user && (user.role === 'admin' || user.role === 'author' || user.role === 'super_admin') && (
        <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Reading Modal */}
      <Modal visible={readingModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.readingContainer}>
          <View style={styles.readingHeader}>
            <TouchableOpacity onPress={() => setReadingModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={30} color="#333" />
            </TouchableOpacity>
            <View style={styles.interactionRow}>
              {selectedDevotional && (
                <>
                  <TouchableOpacity onPress={() => handleLike(selectedDevotional.id)} style={styles.interactionBtn}>
                    <Ionicons name={parseInt(selectedDevotional.user_liked) > 0 ? "heart" : "heart-outline"} size={28} color={parseInt(selectedDevotional.user_liked) > 0 ? "#E74C3C" : "#333"} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleBookmark(selectedDevotional.id)} style={[styles.interactionBtn, {marginLeft: 15}]}>
                    <Ionicons name={parseInt(selectedDevotional.user_bookmarked) > 0 ? "bookmark" : "bookmark-outline"} size={28} color={parseInt(selectedDevotional.user_bookmarked) > 0 ? "#F1C40F" : "#333"} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <ScrollView contentContainerStyle={styles.readingContent}>
            {selectedDevotional && (
              <>
                <Text style={styles.readingTitle}>{selectedDevotional.title}</Text>
                <Text style={styles.readingScripture}>{selectedDevotional.scripture}</Text>
                <Text style={styles.readingAuthor}>Written by {selectedDevotional.author_name}</Text>
                <View style={styles.divider} />
                <Text style={styles.readingBody}>{selectedDevotional.content}</Text>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.createContent}>
            <View style={styles.readingHeader}>
              <Text style={styles.modalTitle}>Post Devotional</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Title" value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={styles.input} placeholder="Scripture (e.g. John 3:16)" value={newScripture} onChangeText={setNewScripture} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Write the devotional content here..." value={newContent} onChangeText={setNewContent} multiline />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateDevotional} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Post Now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 0 },
  headerLogo: { width: 40, height: 40, marginRight: 10 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  // Featured Card
  featuredCard: { height: 250, margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 },
  featuredImage: { width: '100%', height: '100%', position: 'absolute' },
  featuredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'flex-end' },
  featuredBadge: { color: '#FFF', backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  featuredTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  featuredScripture: { color: '#E0E0E0', fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  interactionTextWhite: { color: '#FFF', marginLeft: 6, fontWeight: 'bold' },

  // Standard Card
  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  scripture: { fontSize: 14, fontStyle: 'italic', color: '#666', marginTop: 4, marginBottom: 8 },
  contentPreview: { fontSize: 15, color: '#555', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEE' },
  author: { fontSize: 12, color: '#888' },
  
  // Interactions
  interactionRow: { flexDirection: 'row', alignItems: 'center' },
  interactionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  interactionText: { color: '#666', marginLeft: 6, fontWeight: 'bold' },

  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  
  // FAB
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#4A90E2', borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  
  // Reading Modal
  readingContainer: { flex: 1, backgroundColor: '#FFF' },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  closeBtn: { padding: 5 },
  readingContent: { padding: 24, paddingBottom: 100 },
  readingTitle: { fontSize: 28, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  readingScripture: { fontSize: 16, fontStyle: 'italic', color: '#4A90E2', marginBottom: 12 },
  readingAuthor: { fontSize: 14, color: '#888', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 24 },
  readingBody: { fontSize: 18, color: '#333', lineHeight: 28 },

  // Create Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  input: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16, marginBottom: 16 },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#4A90E2', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
