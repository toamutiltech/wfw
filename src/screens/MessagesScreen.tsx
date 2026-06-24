import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [pendingData, setPendingData] = useState<any[]>([]);

  // Hardcoded for testing: Suppose we are viewing Group Chat ID 1, as User ID 1
  const TEST_GROUP_ID = 1;
  const TEST_USER_ID = 1;

  useEffect(() => {
    fetchMessages();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        pollForUpdates();
      }, 5000); // Poll faster for chat (5 seconds)
      return () => clearInterval(interval);
    }, [messages])
  );

  const pollForUpdates = async () => {
    try {
      const response = await client.get(`/messages.php?group_id=${TEST_GROUP_ID}`);
      const freshMessages = response.data.messages || [];
      if (freshMessages.length > 0 && messages.length > 0) {
        if (freshMessages[0].id !== messages[0].id || freshMessages.length !== messages.length) {
          setPendingData(freshMessages);
          setHasNewUpdate(true);
        }
      } else if (freshMessages.length > 0 && messages.length === 0) {
        setPendingData(freshMessages);
        setHasNewUpdate(true);
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await client.get(`/messages.php?group_id=${TEST_GROUP_ID}`);
      setMessages(response.data.messages || []);
      setHasNewUpdate(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };
  
  const applyUpdate = () => {
    setMessages(pendingData);
    setHasNewUpdate(false);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    try {
      await client.post('/messages.php', {
        sender_id: TEST_USER_ID,
        group_id: TEST_GROUP_ID,
        content: inputText.trim(),
      });
      setInputText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender_id === TEST_USER_ID;
    
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
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
        <Text style={styles.header}>Fellowship Group</Text>
      </View>
      
      {hasNewUpdate && (
        <TouchableOpacity style={styles.updateBanner} onPress={applyUpdate}>
          <Text style={styles.updateBannerText}>⬆️ New messages! Tap to read.</Text>
        </TouchableOpacity>
      )}

      {loading && messages.length === 0 ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          inverted={false} // Would normally want to invert for chat, but depends on query order
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginBottom: 8,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  updateBannerText: {
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
