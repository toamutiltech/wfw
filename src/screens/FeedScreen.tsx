import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';
import PostItem from '../components/PostItem';

const FeedScreen = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const fetchPosts = async () => {
    try {
      const response = await client.get('/posts.php');
      if (response.data.status === 'success') {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fellowship Feed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DiscoverUsers')}>
          <Ionicons name="people" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostItem post={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.createPostContainer}>
            <TouchableOpacity 
              style={styles.createPostInput}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <View style={styles.avatarPlaceholder} />
              <Text style={styles.createPostText}>What's on your mind?</Text>
            </TouchableOpacity>
            <View style={styles.createPostActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreatePost', { type: 'image' })}>
                <Ionicons name="image" size={20} color="#4CAF50" />
                <Text style={styles.actionText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreatePost', { type: 'video' })}>
                <Ionicons name="videocam" size={20} color="#E91E63" />
                <Text style={styles.actionText}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                 {/* Live functionality can be added here or just link to create text */}
                <Ionicons name="radio" size={20} color="#F44336" />
                <Text style={styles.actionText}>Live</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createPostContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  createPostInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 10,
  },
  createPostText: {
    color: '#888',
    fontSize: 16,
  },
  createPostActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: '#555',
    fontWeight: '500',
  }
});

export default FeedScreen;
