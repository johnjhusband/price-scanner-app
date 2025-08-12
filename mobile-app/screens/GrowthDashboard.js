import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { brandColors, typography } from '../theme/brandColors';

const GrowthDashboard = ({ isVisible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [monitoring, setMonitoring] = useState(false);

  const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000';

  const fetchData = async () => {
    try {
      // Fetch growth stats
      const statsResponse = await fetch(`${API_URL}/api/growth/status`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData);
      }

      // Fetch recent questions
      const questionsResponse = await fetch(`${API_URL}/api/growth/questions?limit=5`);
      const questionsData = await questionsResponse.json();
      if (questionsData.success) {
        setQuestions(questionsData.questions);
      }

      // Fetch recent content
      const contentResponse = await fetch(`${API_URL}/api/growth/content?limit=5`);
      const contentData = await contentResponse.json();
      if (contentData.success) {
        setContent(contentData.content);
      }
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  const triggerMonitoring = async () => {
    setMonitoring(true);
    try {
      const response = await fetch(`${API_URL}/api/growth/monitor/reddit`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        // Refresh data after a delay
        setTimeout(fetchData, 3000);
      }
    } catch (error) {
      console.error('Error triggering monitor:', error);
    } finally {
      setMonitoring(false);
    }
  };

  const generateContent = async (postId) => {
    try {
      const response = await fetch(`${API_URL}/api/growth/generate/${postId}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh to show new content
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Growth Automation</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.monitorButton}
            onPress={triggerMonitoring}
            disabled={monitoring}
          >
            {monitoring ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="search" size={16} color="#FFFFFF" />
                <Text style={styles.monitorButtonText}>Monitor Reddit</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={brandColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'questions' && styles.activeTab]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/growth/questions';
            } else {
              Linking.openURL(`${API_URL}/growth/questions`);
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'questions' && styles.activeTabText]}>
            Questions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={[styles.tabText, activeTab === 'content' && styles.activeTabText]}>
            Content
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }} />
          }
        >
          {activeTab === 'overview' && stats && (
            <View style={styles.overviewContainer}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.reddit?.total_questions || 0}</Text>
                  <Text style={styles.statLabel}>Questions Found</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.reddit?.processed || 0}</Text>
                  <Text style={styles.statLabel}>Processed</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.content?.total_content || 0}</Text>
                  <Text style={styles.statLabel}>Content Created</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.content?.total_conversions || 0}</Text>
                  <Text style={styles.statLabel}>Conversions</Text>
                </View>
              </View>

              {stats.reddit?.recent_questions && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionTitle}>Recent Questions</Text>
                  {stats.reddit.recent_questions.map((q, index) => (
                    <View key={index} style={styles.questionItem}>
                      <Text style={styles.questionTitle} numberOfLines={2}>{q.title}</Text>
                      <Text style={styles.questionMeta}>r/{q.subreddit} • Score: {q.score}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'questions' && (
            <View style={styles.questionsContainer}>
              <Text style={styles.sectionTitle}>Unprocessed Questions</Text>
              {questions.length === 0 ? (
                <Text style={styles.emptyText}>No new questions found. Run the monitor to find more!</Text>
              ) : (
                questions.map((q) => (
                  <View key={q.post_id} style={styles.questionCard}>
                    <Text style={styles.questionTitle}>{q.title}</Text>
                    <Text style={styles.questionMeta}>r/{q.subreddit} • {q.author}</Text>
                    {q.selftext && (
                      <Text style={styles.questionBody} numberOfLines={3}>{q.selftext}</Text>
                    )}
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => generateContent(q.post_id)}
                    >
                      <Feather name="edit" size={14} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate Content</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'content' && (
            <View style={styles.contentContainer}>
              <Text style={styles.sectionTitle}>Generated Content</Text>
              {content.length === 0 ? (
                <Text style={styles.emptyText}>No content generated yet.</Text>
              ) : (
                content.map((c) => (
                  <View key={c.id} style={styles.contentCard}>
                    <Text style={styles.contentTitle}>{c.title}</Text>
                    <View style={styles.contentMeta}>
                      <Text style={styles.contentStatus}>
                        {c.published ? '✅ Published' : '📝 Draft'}
                      </Text>
                      {c.page_views > 0 && (
                        <Text style={styles.contentViews}>👀 {c.page_views} views</Text>
                      )}
                    </View>
                    <Text style={styles.contentPreview} numberOfLines={2}>
                      {c.content.replace(/<[^>]*>/g, '')}
                    </Text>
                  </View>
                ))
              )}
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
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  monitorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  monitorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.semiBold,
  },
  closeButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: brandColors.primary,
  },
  tabText: {
    fontSize: 16,
    color: brandColors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  activeTabText: {
    color: brandColors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: brandColors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 4,
  },
  recentSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 15,
  },
  questionItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
    marginBottom: 4,
  },
  questionMeta: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  questionsContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  questionBody: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.medium,
  },
  contentContainer: {
    padding: 20,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  contentStatus: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  contentViews: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  contentPreview: {
    fontSize: 14,
    color: brandColors.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: brandColors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default GrowthDashboard;