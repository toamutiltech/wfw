import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>1. Data Collection</Text>
        <Text style={styles.paragraph}>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, or communicate with us.</Text>
        
        <Text style={styles.text}>2. Use of Information</Text>
        <Text style={styles.paragraph}>We use the information we collect to provide, maintain, and improve our services, such as facilitating prayer boards, devotionals, and private group messaging.</Text>

        <Text style={styles.text}>3. Data Deletion</Text>
        <Text style={styles.paragraph}>You have the right to request deletion of your data at any time via the "Delete Account" button in your Profile settings. This action is irreversible and wipes all associated records.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20 },
  text: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 5 },
  paragraph: { fontSize: 15, color: '#666', lineHeight: 22 }
});
