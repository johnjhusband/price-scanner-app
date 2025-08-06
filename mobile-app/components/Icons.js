import React from 'react';
import { View } from 'react-native';

// Platform-specific SVG handling
let Svg, Path, Rect, Circle;
if (typeof window !== 'undefined' && window.document) {
  // Web platform - use inline SVG
  const WebSvg = ({ children, ...props }) => <svg {...props}>{children}</svg>;
  const WebPath = (props) => <path {...props} />;
  const WebRect = (props) => <rect {...props} />;
  const WebCircle = (props) => <circle {...props} />;
  
  Svg = WebSvg;
  Path = WebPath;
  Rect = WebRect;
  Circle = WebCircle;
} else {
  // Native platform - use react-native-svg
  const svgComponents = require('react-native-svg');
  Svg = svgComponents.Svg;
  Path = svgComponents.Path;
  Rect = svgComponents.Rect;
  Circle = svgComponents.Circle;
}

// Camera icon - thin stroke style
export const CameraIcon = ({ size = 20, color = '#000000', strokeWidth = 1.5 }) => (
  <View style={{ marginRight: 8 }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Circle 
        cx="12" 
        cy="13" 
        r="4" 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
    </Svg>
  </View>
);

// Upload icon - minimal cloud with arrow
export const UploadIcon = ({ size = 20, color = '#000000', strokeWidth = 1.5 }) => (
  <View style={{ marginRight: 8 }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// Paste icon - clipboard style
export const PasteIcon = ({ size = 20, color = '#000000', strokeWidth = 1.5 }) => (
  <View style={{ marginRight: 8 }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Rect 
        x="8" 
        y="2" 
        width="8" 
        height="4" 
        rx="1" 
        ry="1" 
        stroke={color} 
        strokeWidth={strokeWidth}
      />
    </Svg>
  </View>
);