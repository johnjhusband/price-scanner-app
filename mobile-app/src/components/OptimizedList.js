import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  VirtualizedList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { createPlatformStyles } from '../utils/platformStyles';

const OptimizedList = ({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing = false,
  loading = false,
  horizontal = false,
  numColumns = 1,
  estimatedItemSize = 50,
  windowSize = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  ...props
}) => {
  // Memoize list optimization props
  const optimizationProps = useMemo(() => ({
    // Performance optimizations
    windowSize: Platform.select({
      ios: windowSize,
      android: windowSize * 1.5, // Android benefits from larger window
    }),
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    removeClippedSubviews: Platform.OS === 'android' ? removeClippedSubviews : false,
    initialNumToRender: Math.ceil(windowSize / 2),
    
    // Memory optimizations
    getItemLayout: estimatedItemSize ? (data, index) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }) : undefined,
    
    // Scroll optimizations
    scrollEventThrottle: 16,
    onEndReachedThreshold,
    
    // Platform-specific
    ...Platform.select({
      android: {
        overScrollMode: 'never',
        nestedScrollEnabled: true,
      },
      ios: {
        directionalLockEnabled: true,
        alwaysBounceVertical: !horizontal,
        alwaysBounceHorizontal: horizontal,
      },
    }),
  }), [
    windowSize,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    removeClippedSubviews,
    estimatedItemSize,
    onEndReachedThreshold,
    horizontal,
  ]);

  // Memoized empty component
  const EmptyComponent = useMemo(() => {
    if (ListEmptyComponent) {
      return ListEmptyComponent;
    }
    
    return () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items to display</Text>
      </View>
    );
  }, [ListEmptyComponent]);

  // Memoized footer component
  const FooterComponent = useMemo(() => {
    if (loading && data.length > 0) {
      return () => (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#6200EE" />
        </View>
      );
    }
    return ListFooterComponent;
  }, [loading, data.length, ListFooterComponent]);

  // Refresh control
  const refreshControl = useMemo(() => {
    if (onRefresh) {
      return (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6200EE']} // Android
          tintColor="#6200EE" // iOS
          title="Pull to refresh" // iOS
          titleColor="#6200EE" // iOS
        />
      );
    }
    return undefined;
  }, [refreshing, onRefresh]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    if (!loading && onEndReached) {
      onEndReached();
    }
  }, [loading, onEndReached]);

  // Main render
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={FooterComponent}
      ListEmptyComponent={EmptyComponent}
      refreshControl={refreshControl}
      onEndReached={handleEndReached}
      horizontal={horizontal}
      numColumns={numColumns}
      {...optimizationProps}
      {...props}
    />
  );
};

// Optimized section list variant
export const OptimizedSectionList = ({
  sections,
  renderSectionHeader,
  renderSectionFooter,
  stickySectionHeadersEnabled = true,
  ...props
}) => {
  const SectionList = require('react-native').SectionList;
  
  return (
    <SectionList
      sections={sections}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      stickySectionHeadersEnabled={Platform.select({
        ios: stickySectionHeadersEnabled,
        android: false, // Android has performance issues with sticky headers
      })}
      {...props}
    />
  );
};

// Hook for virtualized list optimization
export const useListOptimization = (dataLength) => {
  const viewabilityConfig = useMemo(() => ({
    minimumViewTime: 300,
    viewAreaCoveragePercentThreshold: 50,
    itemVisiblePercentThreshold: 50,
    waitForInteraction: true,
  }), []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    // Track visible items for analytics or lazy loading
    if (__DEV__) {
      console.log('Visible items:', viewableItems.length);
    }
  }, []);

  return {
    viewabilityConfig,
    onViewableItemsChanged,
  };
};

const styles = createPlatformStyles({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default React.memo(OptimizedList);