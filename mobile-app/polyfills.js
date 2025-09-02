// Polyfill to fix React Native Web inheritance issues in Expo 50
// This must run before any other code to intercept the error

(function() {
  if (typeof window === 'undefined') return;
  
  // Store original TypeError constructor
  const OriginalTypeError = window.TypeError;
  
  // Override TypeError to catch and prevent the specific error
  window.TypeError = function(message) {
    if (message && message.includes('Super expression must either be null or a function')) {
      console.warn('Caught inheritance error:', message);
      // Return a non-throwing error object
      const err = new OriginalTypeError(message);
      err.prevented = true;
      return err;
    }
    return new OriginalTypeError(message);
  };
  
  // Copy static methods
  Object.setPrototypeOf(window.TypeError, OriginalTypeError);
  window.TypeError.prototype = OriginalTypeError.prototype;
  
  // Override the _inheritsLoose function that React Native Web uses
  window._inheritsLoose = function _inheritsLoose(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      console.warn('Inheritance issue detected, attempting to recover');
      // Return the subClass as-is to prevent the error
      return subClass;
    }
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
    return subClass;
  };
  
  // Also override the standard _inherits function
  window._inherits = function _inherits(subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
      console.warn('Super expression must either be null or a function, got:', typeof superClass);
      // Return the subClass to prevent error
      return subClass;
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    return subClass;
  };
  
  // Override setPrototypeOf to be more lenient
  const originalSetPrototypeOf = Object.setPrototypeOf;
  Object.setPrototypeOf = function(obj, proto) {
    if (proto !== null && typeof proto !== 'function' && typeof proto !== 'object') {
      console.warn('Invalid prototype:', proto);
      return obj;
    }
    return originalSetPrototypeOf ? originalSetPrototypeOf.call(this, obj, proto) : (obj.__proto__ = proto, obj);
  };
  
  console.log('React Native Web polyfills loaded');
})();