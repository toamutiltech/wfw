import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function HomeScreen() {
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<any[]>([]);

  useEffect(() => {
    fetchDevotionals();
  }, []);

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
      const response = await client.get('/devotionals.php');
      const freshDevotionals = response.data.devotionals || [];
      
      if (freshDevotionals.length > 0 && devotionals.length > 0) {
        if (freshDevotionals[0].id !== devotionals[0].id || freshDevotionals.length !== devotionals.length) {
          setPendingData(freshDevotionals);
          setHasNewUpdate(true);
        }
      } else if (freshDevotionals.length > 0 && devotionals.length === 0) {
        setPendingData(freshDevotionals);
        setHasNewUpdate(true);
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const fetchDevotionals = async () => {
    try {
      // First try to load cached data for instant display
      const cachedData = await AsyncStorage.getItem('cached_devotionals');
      if (cachedData) {
        setDevotionals(JSON.parse(cachedData));
      }
      
      // Then fetch fresh data from API
      const response = await client.get('/devotionals.php');
      const freshDevotionals = response.data.devotionals || [];
      
      setDevotionals(freshDevotionals);
      setHasNewUpdate(false);
      
      // Save to cache
      await AsyncStorage.setItem('cached_devotionals', JSON.stringify(freshDevotionals));
      
    } catch (error) {
      console.error('Error fetching devotionals:', error);
      // If we don't have devotionals from cache, show an error
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
  
  const applyUpdate = () => {
    setDevotionals(pendingData);
    setHasNewUpdate(false);
    AsyncStorage.setItem('cached_devotionals', JSON.stringify(pendingData));
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.scripture}>{item.scripture}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.author}>Shared by: {item.author_name || 'Anonymous'}</Text>
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
        <Text style={styles.header}>Daily Devotionals</Text>
      </View>

      {hasNewUpdate && (
        <TouchableOpacity style={styles.updateBanner} onPress={applyUpdate}>
          <Text style={styles.updateBannerText}>⬆️ New update available! Tap to refresh.</Text>
        </TouchableOpacity>
      )}

      {loading && devotionals.length === 0 ? (
        <ActivityIndicator size="large" color="#4A90E2" />
      ) : (
        <FlatList
          data={devotionals}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No devotionals available.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  scripture: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  author: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  updateBanner: {
    backgroundColor: '#E8F4F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  updateBannerText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
