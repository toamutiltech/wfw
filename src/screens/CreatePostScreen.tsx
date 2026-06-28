import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';

const CreatePostScreen = () => {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const pickMedia = async (mediaType: ImagePicker.MediaTypeOptions) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      quality: 0.8, // compress slightly
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMedia(result.assets[0]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !media) {
      Alert.alert("Empty Post", "Please write something or attach a photo/video.");
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = 'text';

      // 1. Upload media if present
      if (media) {
        const formData = new FormData();
        const fileExt = media.uri.split('.').pop();
        const mimeType = media.type === 'video' ? `video/${fileExt}` : `image/${fileExt}`;
        
        formData.append('file', {
          uri: Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri,
          name: `upload.${fileExt}`,
          type: mimeType,
        } as any);

        const uploadResponse = await client.post('/upload.php', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadResponse.data.status === 'success') {
          mediaUrl = uploadResponse.data.url;
          mediaType = uploadResponse.data.type;
        } else {
          Alert.alert("Upload Failed", uploadResponse.data.message || "Failed to upload media");
          setLoading(false);
          return;
        }
      }

      // 2. Create Post
      const postResponse = await client.post('/posts.php', {
        content: content,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (postResponse.data.status === 'success') {
        navigation.goBack();
      } else {
        Alert.alert("Error", postResponse.data.message || "Failed to create post");
      }
    } catch (error: any) {
      console.error("Post creation error", error.response?.data || error);
      Alert.alert("Error", "Something went wrong while posting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          style={[styles.postButton, (!content.trim() && !media) ? styles.postButtonDisabled : null]} 
          onPress={handlePost}
          disabled={loading || (!content.trim() && !media)}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postButtonText}>POST</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
        />
        
        {media && (
          <View style={styles.mediaPreviewContainer}>
            {media.type === 'video' ? (
               <View style={styles.videoPreview}>
                 <Ionicons name="videocam" size={40} color="#fff" />
                 <Text style={styles.videoPreviewText}>Video Attached</Text>
               </View>
            ) : (
               <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
            )}
            <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => pickMedia(ImagePicker.MediaTypeOptions.Images)}>
          <Ionicons name="image" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => pickMedia(ImagePicker.MediaTypeOptions.Videos)}>
          <Ionicons name="videocam" size={24} color="#E91E63" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn}>
           {/* Placeholder for live stream linking or creation */}
           <Ionicons name="radio" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#A0C0E4',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputContainer: {
    flex: 1,
    padding: 15,
  },
  input: {
    fontSize: 18,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  toolbar: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toolBtn: {
    marginRight: 20,
  },
  mediaPreviewContainer: {
    marginTop: 20,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  mediaPreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  videoPreview: {
    width: 200,
    height: 300, // 9:16 approx
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    color: '#fff',
    marginTop: 10,
  },
  removeMedia: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  }
});

export default CreatePostScreen;
