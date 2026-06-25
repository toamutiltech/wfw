import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function MessagesScreen() {
  const { user } = useContext(AuthContext);
  
  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Group state
  const [currentGroupId, setCurrentGroupId] = useState(1); // Default Global Fellowship
  const [currentGroupName, setCurrentGroupName] = useState('Global Fellowship');
  const [myGroups, setMyGroups] = useState<any[]>([]);
  
  // Modals state
  const [groupsModalVisible, setGroupsModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [joinGroupModalVisible, setJoinGroupModalVisible] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchMyGroups();
  }, [currentGroupId]);

  const fetchMyGroups = async () => {
    if (!user) return;
    try {
      const response = await client.get(`/groups.php?action=my_groups&user_id=${user.id}`);
      if (response.data && response.data.groups) {
        setMyGroups(response.data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await client.get(`/messages.php?group_id=${currentGroupId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pollForUpdates = async () => {
    try {
      const response = await client.get(`/messages.php?group_id=${currentGroupId}`);
      const newData = response.data.messages || [];
      
      // Auto-update messages silently if there's a difference in length or newest message ID
      if (newData.length !== messages.length || (newData.length > 0 && messages.length > 0 && newData[0].id !== messages[0].id)) {
         setMessages(newData);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(pollForUpdates, 5000);
      return () => clearInterval(interval);
    }, [messages, currentGroupId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (!user) {
      Alert.alert("Sign In Required", "You must be logged in to send messages.");
      return;
    }

    try {
      await client.post('/messages.php', {
        sender_id: user.id,
        group_id: currentGroupId,
        content: inputText.trim(),
      });
      setInputText('');
      fetchMessages(); 
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setSubmitting(true);
    try {
      const response = await client.post('/groups.php?action=create', {
        name: newGroupName,
        description: newGroupDesc,
        created_by: user.id,
      });
      
      const newGroupId = response.data.id;
      Alert.alert('Success', `Group created! Share this join code with others: ${newGroupId}`);
      setCreateGroupModalVisible(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchMyGroups();
      switchGroup(newGroupId, newGroupName);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !user) return;
    setSubmitting(true);
    try {
      await client.post('/groups.php?action=join', {
        group_id: joinCode,
        user_id: user.id,
      });
      
      Alert.alert('Success', 'Joined group successfully!');
      setJoinGroupModalVisible(false);
      setJoinCode('');
      fetchMyGroups();
      switchGroup(parseInt(joinCode), `Group ${joinCode}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to join group. Check the code.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchGroup = (id: number, name: string) => {
    setCurrentGroupId(id);
    setCurrentGroupName(name);
    setGroupsModalVisible(false);
    setLoading(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = user && item.sender_id === user.id;
    
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        {!isMe && (
          <View style={styles.senderInfo}>
            {item.profile_picture ? (
               <Image source={{ uri: item.profile_picture }} style={styles.avatarMini} />
            ) : (
               <View style={styles.avatarMiniPlaceholder}>
                 <Text style={styles.avatarMiniText}>{item.sender_name?.charAt(0) || 'U'}</Text>
               </View>
            )}
            <Text style={styles.senderName}>{item.sender_name || item.sender_username}</Text>
          </View>
        )}
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Group Header */}
      <TouchableOpacity 
        style={styles.groupHeader} 
        onPress={() => {
          fetchMyGroups();
          setGroupsModalVisible(true);
        }}
      >
        <View>
          <Text style={styles.groupHeaderTitle}>{currentGroupName}</Text>
          <Text style={styles.groupHeaderSub}>Tap to switch groups</Text>
        </View>
        <Ionicons name="chevron-down" size={24} color="#FFF" />
      </TouchableOpacity>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        inverted={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
        }
        ListEmptyComponent={<Text style={styles.empty}>No messages in {currentGroupName} yet. Say hello!</Text>}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Groups Modal */}
      <Modal visible={groupsModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Your Groups</Text>
              <TouchableOpacity onPress={() => setGroupsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.groupItem, currentGroupId === 1 && styles.activeGroupItem]}
              onPress={() => switchGroup(1, 'Global Fellowship')}
            >
              <Ionicons name="earth" size={24} color={currentGroupId === 1 ? "#4A90E2" : "#666"} />
              <Text style={[styles.groupItemName, currentGroupId === 1 && styles.activeGroupText]}>Global Fellowship</Text>
            </TouchableOpacity>

            <FlatList
              data={myGroups}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                if (item.id === 1) return null; // Already rendered Global Fellowship
                const isActive = item.id === currentGroupId;
                return (
                  <TouchableOpacity 
                    style={[styles.groupItem, isActive && styles.activeGroupItem]}
                    onPress={() => switchGroup(item.id, item.name)}
                  >
                    <Ionicons name="people" size={24} color={isActive ? "#4A90E2" : "#666"} />
                    <View style={{ marginLeft: 15, flex: 1 }}>
                      <Text style={[styles.groupItemName, isActive && styles.activeGroupText]}>{item.name}</Text>
                      <Text style={styles.groupItemId}>Join Code: {item.id}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 300 }}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => { setGroupsModalVisible(false); setJoinGroupModalVisible(true); }}>
                <Text style={styles.actionBtnTextOutline}>Join Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSolid} onPress={() => { setGroupsModalVisible(false); setCreateGroupModalVisible(true); }}>
                <Text style={styles.actionBtnTextSolid}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={createGroupModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Create Private Group</Text>
            <TextInput style={styles.modalInput} placeholder="Group Name" value={newGroupName} onChangeText={setNewGroupName} />
            <TextInput style={styles.modalInput} placeholder="Description (Optional)" value={newGroupDesc} onChangeText={setNewGroupDesc} />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.actionBtnOutline, {flex: 1, marginRight: 10}]} onPress={() => setCreateGroupModalVisible(false)}>
                <Text style={styles.actionBtnTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSolid, {flex: 1}]} onPress={handleCreateGroup} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnTextSolid}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal visible={joinGroupModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Join Group</Text>
            <Text style={{color: '#666', marginBottom: 15}}>Enter the Group ID code shared with you.</Text>
            <TextInput style={styles.modalInput} placeholder="Group ID Code (e.g. 5)" value={joinCode} onChangeText={setJoinCode} keyboardType="numeric" />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={[styles.actionBtnOutline, {flex: 1, marginRight: 10}]} onPress={() => setJoinGroupModalVisible(false)}>
                <Text style={styles.actionBtnTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSolid, {flex: 1}]} onPress={handleJoinGroup} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionBtnTextSolid}>Join</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  groupHeader: {
    backgroundColor: '#4A90E2',
    padding: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  groupHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  listContent: { padding: 15, paddingBottom: 20 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888', fontStyle: 'italic' },
  
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  myBubble: { backgroundColor: '#4A90E2', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EEE' },
  
  senderInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  avatarMini: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  avatarMiniPlaceholder: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#CCC', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  avatarMiniText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  
  messageText: { fontSize: 15 },
  myMessageText: { color: '#FFF' },
  theirMessageText: { color: '#333' },
  
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  theirTimestamp: { color: '#999' },
  
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 15 },
  sendButton: { marginLeft: 10, marginBottom: 5, backgroundColor: '#4A90E2', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, justifyContent: 'center' },
  sendButtonText: { color: '#FFF', fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 400 },
  smallModalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, margin: 20, marginBottom: '50%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  groupItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  activeGroupItem: { backgroundColor: '#F0F7FF' },
  groupItemName: { fontSize: 16, color: '#333', marginLeft: 15, fontWeight: '500' },
  activeGroupText: { color: '#4A90E2', fontWeight: 'bold' },
  groupItemId: { fontSize: 12, color: '#888' },
  
  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionBtnOutline: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#4A90E2', alignItems: 'center', marginRight: 10 },
  actionBtnTextOutline: { color: '#4A90E2', fontWeight: 'bold' },
  actionBtnSolid: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#4A90E2', alignItems: 'center' },
  actionBtnTextSolid: { color: '#FFF', fontWeight: 'bold' },
  modalInput: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', fontSize: 16, marginBottom: 15 },
});
