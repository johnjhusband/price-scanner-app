import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  Alert
} from 'react-native';
import { brandColors, typography } from '../theme/brandColors';
import { Search, Filter, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react-native';

const AdminDashboard = ({ isVisible, onClose }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [stats, setStats] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback');
  const [userActivity, setUserActivity] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000';

  // Category labels for display
  const categoryLabels = {
    value_accuracy: 'Value Accuracy',
    authenticity_concern: 'Authenticity Concern',
    platform_suggestion: 'Platform Suggestion',
    ui_feedback: 'UI Feedback',
    technical_issue: 'Technical Issue',
    feature_request: 'Feature Request',
    general_praise: 'General Praise',
    other: 'Other'
  };

  // Sentiment colors
  const sentimentColors = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280'
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSentiment !== 'all') params.append('sentiment', selectedSentiment);
      
      const response = await fetch(`${API_URL}/api/feedback/admin?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedbackData(data.feedback || []);
        setStats(data.stats || {});
        setCategoryBreakdown(data.category_breakdown || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger GPT analysis
  const triggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch(`${API_URL}/api/feedback/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message);
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to analyze feedback');
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      Alert.alert('Error', 'Failed to analyze feedback');
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await fetch(`${API_URL}/api/feedback/admin/user-activity-summary`);
      const data = await response.json();
      
      if (data.success) {
        setUserActivity(data.users);
        setUserStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchDashboardData();
      fetchUserActivity();
    }
  }, [isVisible, selectedCategory, selectedSentiment]);

  // Filter and sort data
  const filteredData = feedbackData
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.item_name?.toLowerCase().includes(query) ||
        item.feedback_text?.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.user_description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.total_feedback || 0}</Text>
        <Text style={styles.statLabel}>Total Feedback</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: sentimentColors.positive }]}>
          {stats?.positive_rate || '0%'}
        </Text>
        <Text style={styles.statLabel}>Positive Rate</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.analyzed_count || 0}</Text>
        <Text style={styles.statLabel}>Analyzed</Text>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search feedback..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={brandColors.textSecondary}
      />
      
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            const categories = ['all', ...Object.keys(categoryLabels)];
            const currentIndex = categories.indexOf(selectedCategory);
            const nextIndex = (currentIndex + 1) % categories.length;
            setSelectedCategory(categories[nextIndex]);
          }}
        >
          <Filter size={16} color={brandColors.text} />
          <Text style={styles.filterText}>
            {selectedCategory === 'all' ? 'All Categories' : categoryLabels[selectedCategory]}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            const sentiments = ['all', 'positive', 'negative', 'neutral'];
            const currentIndex = sentiments.indexOf(selectedSentiment);
            const nextIndex = (currentIndex + 1) % sentiments.length;
            setSelectedSentiment(sentiments[nextIndex]);
          }}
        >
          <Text style={[
            styles.filterText,
            selectedSentiment !== 'all' && { color: sentimentColors[selectedSentiment] }
          ]}>
            {selectedSentiment === 'all' ? 'All Sentiments' : selectedSentiment}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
          }}
        >
          {sortOrder === 'desc' ? 
            <ChevronDown size={16} color={brandColors.text} /> : 
            <ChevronUp size={16} color={brandColors.text} />
          }
          <Text style={styles.filterText}>Date</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFeedbackItem = (item) => {
    const sentimentIcon = item.sentiment === 'positive' ? 
      <TrendingUp size={16} color={sentimentColors.positive} /> :
      item.sentiment === 'negative' ?
      <TrendingDown size={16} color={sentimentColors.negative} /> :
      <AlertCircle size={16} color={sentimentColors.neutral} />;

    return (
      <TouchableOpacity 
        key={item.id}
        style={styles.feedbackItem}
        onPress={() => setSelectedFeedback(item)}
      >
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackMeta}>
            {sentimentIcon}
            <Text style={styles.itemName}>{item.item_name || 'Unknown Item'}</Text>
            <Text style={styles.helpedDecision}>
              {item.helped_decision}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {item.feedback_text && (
          <Text style={styles.feedbackText} numberOfLines={2}>
            "{item.feedback_text}"
          </Text>
        )}
        
        {item.summary && (
          <Text style={styles.summary}>
            AI Summary: {item.summary}
          </Text>
        )}
        
        <View style={styles.tags}>
          {item.category && (
            <View style={[styles.tag, { backgroundColor: brandColors.surface }]}>
              <Text style={styles.tagText}>{categoryLabels[item.category] || item.category}</Text>
            </View>
          )}
          {item.suggestion_type && (
            <View style={[styles.tag, { backgroundColor: brandColors.background }]}>
              <Text style={styles.tagText}>{item.suggestion_type}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => (
    <Modal
      visible={!!selectedFeedback}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedFeedback(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feedback Details</Text>
            <TouchableOpacity onPress={() => setSelectedFeedback(null)}>
              <X size={24} color={brandColors.text} />
            </TouchableOpacity>
          </View>
          
          {selectedFeedback && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Item</Text>
                <Text style={styles.detailValue}>{selectedFeedback.item_name}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Analysis ID</Text>
                <Text style={styles.detailValue}>{selectedFeedback.analysis_id}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>User Feedback</Text>
                <Text style={styles.detailValue}>
                  {selectedFeedback.feedback_text || 'No text feedback'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Helpful?</Text>
                <Text style={styles.detailValue}>{selectedFeedback.helped_decision}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>AI Analysis</Text>
                <Text style={styles.detailValue}>
                  Sentiment: {selectedFeedback.sentiment || 'Not analyzed'}
                </Text>
                <Text style={styles.detailValue}>
                  Category: {categoryLabels[selectedFeedback.category] || selectedFeedback.category || 'Not analyzed'}
                </Text>
                <Text style={styles.detailValue}>
                  Type: {selectedFeedback.suggestion_type || 'Not analyzed'}
                </Text>
                <Text style={styles.detailValue}>
                  Summary: {selectedFeedback.summary || 'Not analyzed'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Scan Results</Text>
                <Text style={styles.detailValue}>
                  Price: {selectedFeedback.price_range}
                </Text>
                <Text style={styles.detailValue}>
                  Real Score: {selectedFeedback.real_score}%
                </Text>
                <Text style={styles.detailValue}>
                  Trending Score: {selectedFeedback.trending_score}/100
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={styles.headerButtons}>
          {activeTab === 'feedback' && (
            <TouchableOpacity 
              style={styles.analyzeButton}
              onPress={triggerAnalysis}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={brandColors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
            Feedback
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            User Activity
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'feedback' ? (
            <>
              {renderStats()}
              
              {categoryBreakdown.length > 0 && (
                <View style={styles.categoryBreakdown}>
                  <Text style={styles.sectionTitle}>Category Breakdown</Text>
                  <View style={styles.categoryList}>
                    {categoryBreakdown.map(cat => (
                      <View key={cat.category} style={styles.categoryItem}>
                        <Text style={styles.categoryName}>
                          {categoryLabels[cat.category] || cat.category}
                        </Text>
                        <Text style={styles.categoryCount}>{cat.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {renderFilters()}
              
              <View style={styles.feedbackList}>
                <Text style={styles.sectionTitle}>
                  Feedback ({filteredData.length})
                </Text>
                {filteredData.map(renderFeedbackItem)}
              </View>
            </>
          ) : (
            <View style={styles.userActivityContainer}>
              {userStats && (
                <View style={styles.userStatsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userStats.total_users}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userStats.high_value_users}</Text>
                    <Text style={styles.statLabel}>High-Value Users</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userStats.avg_scans_per_user}</Text>
                    <Text style={styles.statLabel}>Avg Scans/User</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.userListContainer}>
                <Text style={styles.sectionTitle}>User Activity</Text>
                {userActivity && userActivity.map(user => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userEmail}>{user.email_obfuscated}</Text>
                      {user.is_high_value === 1 && (
                        <View style={styles.highValueBadge}>
                          <Text style={styles.highValueText}>🏆 High Value</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.userStats}>
                      <Text style={styles.userStat}>Logins: {user.login_count}</Text>
                      <Text style={styles.userStat}>Scans: {user.scan_count}</Text>
                      <Text style={styles.userStat}>Feedback: {user.feedback_count}</Text>
                    </View>
                    <Text style={styles.userDate}>
                      Last seen: {new Date(user.last_login).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
      
      {renderDetailModal()}
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
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.weights.semiBold,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: brandColors.text,
  },
  statLabel: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 4,
  },
  categoryBreakdown: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 15,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  categoryName: {
    fontSize: 14,
    color: brandColors.text,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: typography.weights.semiBold,
    color: brandColors.primary,
  },
  filtersContainer: {
    padding: 20,
    paddingTop: 0,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  filterText: {
    fontSize: 14,
    color: brandColors.text,
  },
  feedbackList: {
    padding: 20,
    paddingTop: 0,
  },
  feedbackItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  helpedDecision: {
    fontSize: 12,
    color: brandColors.textSecondary,
    backgroundColor: brandColors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timestamp: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  feedbackText: {
    fontSize: 14,
    color: brandColors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  summary: {
    fontSize: 13,
    color: brandColors.textSecondary,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: brandColors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: brandColors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: brandColors.text,
    marginBottom: 4,
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
  userActivityContainer: {
    flex: 1,
  },
  userStatsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  userListContainer: {
    padding: 20,
  },
  userItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: brandColors.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
  },
  highValueBadge: {
    backgroundColor: brandColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highValueText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: typography.weights.semiBold,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  userStat: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  userDate: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
});

export default AdminDashboard;