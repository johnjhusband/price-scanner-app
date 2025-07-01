import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

export const SkeletonLoader = ({ width, height, style, borderRadius = 4 }) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.onSurface,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const ResultsSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header Card Skeleton */}
      <View style={styles.headerCard}>
        <SkeletonLoader width={100} height={100} borderRadius={12} />
        <View style={styles.headerInfo}>
          <SkeletonLoader width={180} height={24} style={styles.marginBottom} />
          <SkeletonLoader width={120} height={16} style={styles.marginBottom} />
          <SkeletonLoader width={100} height={16} style={styles.marginBottom} />
          <SkeletonLoader width={140} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Value Card Skeleton */}
      <View style={styles.valueCard}>
        <SkeletonLoader width={200} height={20} style={styles.marginBottom} />
        <SkeletonLoader width={150} height={32} />
      </View>

      {/* Platform Pricing Skeleton */}
      <View style={styles.sectionCard}>
        <SkeletonLoader width={150} height={20} style={styles.sectionTitle} />
        <View style={styles.pricingGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.priceCard}>
              <SkeletonLoader width={80} height={16} style={styles.marginBottom} />
              <SkeletonLoader width={60} height={20} />
            </View>
          ))}
        </View>
      </View>

      {/* Condition Tips Skeleton */}
      <View style={styles.sectionCard}>
        <SkeletonLoader width={180} height={20} style={styles.sectionTitle} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.tipRow}>
            <SkeletonLoader width={24} height={24} borderRadius={12} />
            <SkeletonLoader width={250} height={16} style={styles.tipText} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  marginBottom: {
    marginBottom: 8,
  },
  valueCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  sectionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceCard: {
    width: '48%',
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 12,
  },
});