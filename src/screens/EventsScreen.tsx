import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function EventsScreen() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<any[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(current => {
        const updated = new Date(current);
        updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return updated;
      });
      // Optionally show time picker immediately after on Android
      if (Platform.OS === 'android') {
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEventDate(current => {
        const updated = new Date(current);
        updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        return updated;
      });
    }
  };

  const handleSubmitEvent = async () => {
    if (!newTitle.trim() || !user) {
      Alert.alert('Missing Info', 'Please enter a title and ensure you are logged in.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Format date for MySQL: YYYY-MM-DD HH:MM:SS
      const formattedDate = eventDate.toISOString().slice(0, 19).replace('T', ' ');
      
      await client.post('/events.php', {
        title: newTitle,
        description: newDescription,
        location: newLocation,
        event_date: formattedDate,
        created_by: user.id,
      });
      
      Alert.alert('Success', 'Your event has been created.');
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewLocation('');
      setEventDate(new Date());
      fetchEvents();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit event.');
    } finally {
      setSubmitting(false);
    }
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
          contentContainerStyle={{ paddingBottom: 80 }}
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

      {/* New Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Event Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Location (e.g., Main Hall)"
              value={newLocation}
              onChangeText={setNewLocation}
            />

            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
                <Text style={styles.datePickerText}>
                  {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#4A90E2" />
                <Text style={styles.datePickerText}>
                  {eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={eventDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Event Description..."
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmitEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  fab: {
    position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 20, bottom: 20, backgroundColor: '#4A90E2', borderRadius: 30,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    minHeight: 450
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  input: {
    backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0',
    fontSize: 16, marginBottom: 15
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 0.48,
  },
  datePickerText: {
    marginLeft: 8,
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10
  },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
