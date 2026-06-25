import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TermsScreen() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.</Text>
        
        <Text style={styles.text}>2. User Conduct</Text>
        <Text style={styles.paragraph}>You agree to use the application for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the app.</Text>

        <Text style={styles.text}>3. Content Ownership</Text>
        <Text style={styles.paragraph}>All devotionals, prayers, and messages posted by users remain the intellectual property of the original poster. The administrators reserve the right to moderate content.</Text>
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
