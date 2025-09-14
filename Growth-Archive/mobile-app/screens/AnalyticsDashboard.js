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
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { brandColors, typography } from '../theme/brandColors';
import analyticsTracker from '../utils/analyticsTracker';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsDashboard = ({ isVisible, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, all
  const [analytics, setAnalytics] = useState({
    summary: {},
    topContent: [],
    platformBreakdown: {},
    timeline: []
  });

  const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:3000';

  const handleExport = async () => {
    try {
      // Calculate date range for export
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'all':
          startDate.setFullYear(2020);
          break;
      }

      // Format dates for API
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      // For web, trigger download
      if (Platform.OS === 'web') {
        // Show format selection dialog
        const format = window.confirm('Export as Excel? (OK for Excel, Cancel for CSV)') ? 'excel' : 'csv';
        
        // Trigger download
        const exportUrl = `${API_URL}/api/growth/analytics/export/${format}?start=${start}&end=${end}`;
        window.open(exportUrl, '_blank');
      } else {
        // For mobile, show share sheet with export data
        const response = await fetch(`${API_URL}/api/growth/analytics/export/json?start=${start}&end=${end}`);
        const data = await response.json();
        
        // Convert to shareable text
        const text = `Flippi Analytics Export (${start} to ${end})\n\n` +
          `Total Views: ${data.summary.reduce((acc, day) => acc + day.total_views, 0)}\n` +
          `Total Clicks: ${data.summary.reduce((acc, day) => acc + day.total_clicks, 0)}\n` +
          `Total Shares: ${data.summary.reduce((acc, day) => acc + day.total_shares, 0)}\n` +
          `Total Conversions: ${data.summary.reduce((acc, day) => acc + day.conversions, 0)}`;
        
        // Share the data (you can implement native sharing here)
        alert(text);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export analytics data');
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'all':
          startDate.setFullYear(2020); // Far back enough
          break;
      }

      // Fetch analytics data in parallel
      const [rangeData, topContent, platformData] = await Promise.all([
        analyticsTracker.getAnalyticsRange(startDate, endDate),
        analyticsTracker.getTopContent(10, 'total_views'),
        analyticsTracker.getPlatformBreakdown(startDate, endDate)
      ]);

      // Calculate summary metrics
      const summary = {
        totalViews: 0,
        totalClicks: 0,
        totalShares: 0,
        totalConversions: 0,
        avgCTR: 0
      };

      if (rangeData && rangeData.length > 0) {
        rangeData.forEach(day => {
          summary.totalViews += day.views || 0;
          summary.totalClicks += day.clicks || 0;
          summary.totalShares += day.shares || 0;
          summary.totalConversions += day.conversions || 0;
        });

        if (summary.totalViews > 0) {
          summary.avgCTR = ((summary.totalClicks / summary.totalViews) * 100).toFixed(2);
        }
      }

      setAnalytics({
        summary,
        topContent: topContent || [],
        platformBreakdown: platformData || {},
        timeline: rangeData || []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchAnalytics();
    }
  }, [isVisible, timeRange]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderMetricCard = (label, value, icon, color = brandColors.primary) => (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{formatNumber(value)}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  const renderPlatformBreakdown = () => {
    const platforms = Object.entries(analytics.platformBreakdown || {});
    const totalViews = platforms.reduce((sum, [_, data]) => sum + (data.views || 0), 0);

    if (platforms.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traffic Sources</Text>
        {platforms.map(([platform, data]) => {
          const percentage = totalViews > 0 ? ((data.views / totalViews) * 100).toFixed(1) : 0;
          return (
            <View key={platform} style={styles.platformRow}>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>{platform}</Text>
                <Text style={styles.platformStats}>
                  {formatNumber(data.views)} views • {data.conversions || 0} conversions
                </Text>
              </View>
              <View style={styles.platformMetrics}>
                <Text style={styles.platformPercentage}>{percentage}%</Text>
                <View style={[styles.platformBar, { width: `${percentage}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTopContent = () => {
    if (!analytics.topContent || analytics.topContent.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Content</Text>
        {analytics.topContent.map((content, index) => (
          <TouchableOpacity
            key={content.content_id}
            style={styles.contentRow}
            onPress={() => {
              // Navigate to content detail
              if (Platform.OS === 'web') {
                window.location.href = `/growth/content/${content.content_id}`;
              }
            }}
          >
            <Text style={styles.contentRank}>#{index + 1}</Text>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle} numberOfLines={2}>
                {content.title || 'Untitled Content'}
              </Text>
              <View style={styles.contentStats}>
                <Text style={styles.contentStat}>
                  <Feather name="eye" size={12} /> {formatNumber(content.total_views)}
                </Text>
                <Text style={styles.contentStat}>
                  <Feather name="mouse-pointer" size={12} /> {formatNumber(content.total_clicks)}
                </Text>
                <Text style={styles.contentStat}>
                  <Feather name="share-2" size={12} /> {formatNumber(content.total_shares)}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={brandColors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
            <Feather name="download" size={20} color={brandColors.primary} />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={brandColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timeRangeContainer}>
        {['24h', '7d', '30d', 'all'].map(range => (
          <TouchableOpacity
            key={range}
            style={[styles.timeRangeButton, timeRange === range && styles.timeRangeActive]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeActiveText]}>
              {range === '24h' ? '24 Hours' : 
               range === '7d' ? '7 Days' :
               range === '30d' ? '30 Days' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
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
              fetchAnalytics();
            }} />
          }
        >
          <View style={styles.metricsGrid}>
            {renderMetricCard('Views', analytics.summary.totalViews, 'eye')}
            {renderMetricCard('Clicks', analytics.summary.totalClicks, 'mouse-pointer')}
            {renderMetricCard('Shares', analytics.summary.totalShares, 'share-2')}
            {renderMetricCard('Conversions', analytics.summary.totalConversions, 'check-circle', brandColors.success)}
          </View>

          <View style={styles.ctrCard}>
            <Text style={styles.ctrLabel}>Average CTR</Text>
            <Text style={styles.ctrValue}>{analytics.summary.avgCTR}%</Text>
          </View>

          {renderPlatformBreakdown()}
          {renderTopContent()}
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
    zIndex: 10000,
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
  closeButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: brandColors.background,
    marginRight: 12,
  },
  exportText: {
    marginLeft: 4,
    fontSize: 14,
    color: brandColors.primary,
    fontWeight: typography.weights.medium,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  timeRangeActive: {
    backgroundColor: brandColors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    color: brandColors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  timeRangeActiveText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2,
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
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  ctrCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  ctrLabel: {
    fontSize: 16,
    color: brandColors.textSecondary,
    marginBottom: 8,
  },
  ctrValue: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: brandColors.primary,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
    marginBottom: 16,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
    textTransform: 'capitalize',
  },
  platformStats: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginTop: 2,
  },
  platformMetrics: {
    alignItems: 'flex-end',
    width: 100,
  },
  platformPercentage: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.primary,
    marginBottom: 4,
  },
  platformBar: {
    height: 4,
    backgroundColor: brandColors.primary,
    borderRadius: 2,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  contentRank: {
    fontSize: 16,
    fontWeight: typography.weights.semiBold,
    color: brandColors.textSecondary,
    width: 30,
  },
  contentInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: typography.weights.medium,
    color: brandColors.text,
    marginBottom: 4,
  },
  contentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  contentStat: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
});

export default AnalyticsDashboard;