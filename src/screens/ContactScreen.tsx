import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ContactScreen() {
  const navigation = useNavigation();

  const handleEmail = () => {
    Linking.openURL('mailto:support@toamultitech.tech').catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-unread-outline" size={60} color="#4A90E2" />
        </View>
        <Text style={styles.text}>We'd love to hear from you!</Text>
        <Text style={styles.paragraph}>If you have any questions, feedback, or need technical support, please reach out to our team.</Text>
        
        <TouchableOpacity style={styles.contactBtn} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#FFF" />
          <Text style={styles.contactBtnText}>Email Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, alignItems: 'center', marginTop: 40 },
  iconContainer: { marginBottom: 20 },
  text: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  paragraph: { fontSize: 16, color: '#666', lineHeight: 24, textAlign: 'center', marginBottom: 30 },
  contactBtn: { flexDirection: 'row', backgroundColor: '#4A90E2', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%', justifyContent: 'center' },
  contactBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }
});
