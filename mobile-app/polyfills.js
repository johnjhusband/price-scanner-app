// Polyfill to fix React Native Web inheritance issues in Expo 50
if (typeof window !== 'undefined') {
  // Store original setPrototypeOf
  const originalSetPrototypeOf = Object.setPrototypeOf;
  
  // Override setPrototypeOf to handle null/function check more gracefully
  Object.setPrototypeOf = function(obj, proto) {
    if (proto !== null && typeof proto !== 'function' && typeof proto !== 'object') {
      console.warn('Invalid prototype:', proto);
      return obj;
    }
    return originalSetPrototypeOf.call(this, obj, proto);
  };
  
  // Fix for _inherits function used by Babel
  if (!window._inheritsFixed) {
    const originalInherits = window._inherits;
    window._inherits = function(subClass, superClass) {
      if (typeof superClass !== 'function' && superClass !== null) {
        console.warn('Super expression must either be null or a function, got:', typeof superClass);
        // Try to recover by skipping inheritance
        return subClass;
      }
      if (originalInherits) {
        return originalInherits(subClass, superClass);
      }
      // Fallback implementation
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      if (superClass) Object.setPrototypeOf(subClass, superClass);
      return subClass;
    };
    window._inheritsFixed = true;
  }
}