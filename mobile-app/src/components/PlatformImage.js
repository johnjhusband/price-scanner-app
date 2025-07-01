import React, { useState, useCallback } from 'react';
import { View, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { createPlatformStyles } from '../utils/platformStyles';

const PlatformImage = ({
  source,
  style,
  placeholder,
  transition = 300,
  priority = 'normal',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  // Platform-specific image optimization
  const optimizedSource = React.useMemo(() => {
    if (typeof source === 'string') {
      // Add platform-specific image CDN parameters
      if (Platform.OS === 'web') {
        // Web: Use WebP format if supported
        return source.includes('?') 
          ? `${source}&format=webp&quality=85`
          : `${source}?format=webp&quality=85`;
      } else {
        // Mobile: Request appropriate size based on screen density
        const { PixelRatio } = require('react-native');
        const scale = PixelRatio.get();
        return source.includes('?')
          ? `${source}&dpr=${scale}`
          : `${source}?dpr=${scale}`;
      }
    }
    return source;
  }, [source]);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={optimizedSource}
        style={styles.image}
        placeholder={placeholder}
        placeholderContentFit="cover"
        contentFit="cover"
        transition={transition}
        priority={priority}
        cachePolicy="memory-disk"
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color="#6200EE"
            style={styles.loader}
          />
        </View>
      )}
      
      {hasError && (
        <View style={styles.errorContainer}>
          <Image
            source={require('../assets/image-error.png')}
            style={styles.errorIcon}
            contentFit="contain"
          />
        </View>
      )}
    </View>
  );
};

const styles = createPlatformStyles({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    ios: {
      transform: [{ scale: 1 }],
    },
    android: {
      transform: [{ scale: 1.2 }],
    },
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 50,
    height: 50,
    opacity: 0.5,
  },
});

export default React.memo(PlatformImage);