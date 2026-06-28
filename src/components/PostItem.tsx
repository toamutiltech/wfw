import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import client from '../api/client';

const { width } = Dimensions.get('window');

interface Post {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  profile_picture?: string;
  content: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'video' | 'livestream';
  created_at: string;
  like_count: number;
  is_liked: boolean;
}

interface PostItemProps {
  post: Post;
}

const PostItem: React.FC<PostItemProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});

  const handleLike = async () => {
    try {
      const originalIsLiked = isLiked;
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

      const response = await client.post('/posts.php?action=like', { post_id: post.id });
      if (response.data.status !== 'success') {
        // Revert on failure
        setIsLiked(originalIsLiked);
        setLikeCount(isLiked ? likeCount : likeCount - 1);
      }
    } catch (error) {
      console.error('Like error', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.profile_picture ? (
             <Image source={{ uri: post.profile_picture }} style={styles.avatarImage} />
          ) : (
             <Ionicons name="person-circle-outline" size={40} color="#888" />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{post.full_name || post.username}</Text>
          <Text style={styles.time}>{formatDate(post.created_at)}</Text>
        </View>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.contentText}>{post.content}</Text>
      ) : null}

      {/* Media */}
      {post.media_type === 'image' && post.media_url && (
        <Image source={{ uri: post.media_url }} style={styles.imageMedia} resizeMode="cover" />
      )}

      {post.media_type === 'video' && post.media_url && (
        <View style={styles.videoContainer}>
          <Video
            ref={video}
            style={styles.videoMedia}
            source={{ uri: post.media_url }}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping={true}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "red" : "#555"} />
          <Text style={styles.actionText}>{likeCount} Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color="#555" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={22} color="#555" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  avatar: {
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: {
    color: '#888',
    fontSize: 12,
  },
  contentText: {
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  imageMedia: {
    width: width,
    height: width, // Square or could be dynamic
  },
  videoContainer: {
    width: width,
    height: width * (16 / 9), // 9:16 aspect ratio (Reels style)
    backgroundColor: '#000',
  },
  videoMedia: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: '#555',
  }
});

export default PostItem;
