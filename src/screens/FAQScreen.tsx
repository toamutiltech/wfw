import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function FAQScreen() {
  const navigation = useNavigation();

  const faqs = [
    { q: "How do I create a private group?", a: "Go to the Messages tab, tap the group name at the top to open the switcher, and select 'Create Group'." },
    { q: "Who can post Devotionals?", a: "Currently, only designated Authors and Administrators can post Devotionals. You can still read, like, and bookmark them!" },
    { q: "How do I delete my account?", a: "You can permanently delete your account by going to Profile > Settings > Delete Account." }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {faqs.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.question}>{item.q}</Text>
            <Text style={styles.answer}>{item.a}</Text>
          </View>
        ))}
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
  faqItem: { marginBottom: 25 },
  question: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  answer: { fontSize: 15, color: '#666', lineHeight: 22 }
});
