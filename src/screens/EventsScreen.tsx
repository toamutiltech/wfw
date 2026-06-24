import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        pollForUpdates();
      }, 30000);
      return () => clearInterval(interval);
    }, [events])
  );

  const pollForUpdates = async () => {
    try {
      const response = await client.get('/events.php');
      const freshEvents = response.data.events || [];
      if (freshEvents.length > 0 && events.length > 0) {
        if (freshEvents[0].id !== events[0].id || freshEvents.length !== events.length) {
          setPendingData(freshEvents);
          setHasNewUpdate(true);
        }
      } else if (freshEvents.length > 0 && events.length === 0) {
        setPendingData(freshEvents);
        setHasNewUpdate(true);
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await client.get('/events.php');
      setEvents(response.data.events || []);
      setHasNewUpdate(false);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };
  
  const applyUpdate = () => {
    setEvents(pendingData);
    setHasNewUpdate(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    // Format the date nicely
    const eventDate = new Date(item.event_date);
    const dateString = eventDate.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
      <View style={styles.card}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeMonth}>{eventDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
          <Text style={styles.dateBadgeDay}>{eventDate.getDate()}</Text>
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.timeText}>{dateString}</Text>
          <Text style={styles.locationText}>📍 {item.location || 'Online / TBD'}</Text>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <Text style={styles.organizer}>Organized by: {item.organizer_name}</Text>
        </View>
      </View>
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
        <Text style={styles.header}>Fellowship Events</Text>
      </View>

      {hasNewUpdate && (
        <TouchableOpacity style={styles.updateBanner} onPress={applyUpdate}>
          <Text style={styles.updateBannerText}>⬆️ New events available! Tap to refresh.</Text>
        </TouchableOpacity>
      )}

      {loading && events.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No upcoming events. Check back later!</Text>}
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
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateBadge: {
    backgroundColor: '#4A90E2',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
  dateBadgeMonth: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateBadgeDay: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  eventInfo: {
    padding: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#E67E22',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  organizer: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
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
