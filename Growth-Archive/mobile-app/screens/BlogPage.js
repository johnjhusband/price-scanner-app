import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  RefreshControl,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { brandColors, typography } from '../theme/brandColors';

const BlogPage = ({ isVisible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000';
  const GROWTH_URL = Platform.OS === 'web' ? '' : 'http://localhost:3003';

  const fetchBlogPosts = async () => {
    try {
      setError(null);
      const response = await fetch(`${GROWTH_URL}/api/growth/content?published=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      
      const data = await response.json();
      if (data.success) {
        setBlogPosts(data.content || []);
      } else {
        throw new Error(data.error || 'Failed to load blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchBlogPosts();
    }
  }, [isVisible]);

  const openBlogPost = (contentId) => {
    // For now, open the growth dashboard to view content
    const url = Platform.OS === 'web' 
      ? `/growth/questions` 
      : `${GROWTH_URL}/growth/questions`;
    
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };


  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Valuation Guides</Text>
          <Text style={styles.subtitle}>Expert insights on item values</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={brandColors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={brandColors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBlogPosts}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchBlogPosts();
            }} />
          }
        >
          {blogPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={48} color={brandColors.textSecondary} />
              <Text style={styles.emptyText}>No valuation guides available yet</Text>
              <Text style={styles.emptySubtext}>Check back soon for expert insights!</Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {blogPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => openBlogPost(post.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.postContent}>
                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                    <Text style={styles.postDescription} numberOfLines={3}>
                      {post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : ''}
                    </Text>
                    <View style={styles.postMeta}>
                      <Text style={styles.postDate}>
                        {formatDate(post.created_at)}
                      </Text>
                      {post.page_views > 0 && (
                        <Text style={styles.postViews}>
                          <Feather name="eye" size={12} /> {post.page_views} views
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: brandColors.background,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: typography.weights.bold,
    color: brandColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: brandColors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
  },
  content: {
    flex: 1,
  },
  postsContainer: {
    padding: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  postViews: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: brandColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
});

export default BlogPage;