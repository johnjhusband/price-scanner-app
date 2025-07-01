import React, { Component } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card } from 'react-native-paper';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Send error to crash reporting service
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      // In production, send to crash reporting service
      if (!__DEV__) {
        // Example: Sentry, Bugsnag, or custom error reporting
        const errorReport = {
          message: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          appVersion: Application.nativeApplicationVersion,
          buildVersion: Application.nativeBuildVersion,
          platform: Constants.platform,
          timestamp: new Date().toISOString(),
        };

        // Send to your error reporting endpoint
        // await apiService.post('/errors', errorReport);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.card}>
              <Card.Title
                title="Oops! Something went wrong"
                titleStyle={styles.title}
              />
              <Card.Content>
                <Text style={styles.message}>
                  We're sorry, but something unexpected happened. The error has been
                  reported and we'll look into it.
                </Text>

                {__DEV__ && (
                  <View style={styles.errorDetails}>
                    <Text style={styles.errorTitle}>Error Details:</Text>
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>
                        {this.state.error && this.state.error.toString()}
                      </Text>
                    </View>

                    <Text style={styles.errorTitle}>Component Stack:</Text>
                    <ScrollView style={styles.stackTrace}>
                      <Text style={styles.stackText}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                      </Text>
                    </ScrollView>
                  </View>
                )}

                <View style={styles.actions}>
                  <Button
                    mode="contained"
                    onPress={this.handleReset}
                    style={styles.button}
                  >
                    Try Again
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => {
                      // Navigate to home or restart app
                      this.handleReset();
                      if (this.props.onReset) {
                        this.props.onReset();
                      }
                    }}
                    style={styles.button}
                  >
                    Go to Home
                  </Button>
                </View>

                {this.state.errorCount > 2 && (
                  <Text style={styles.warning}>
                    This error has occurred multiple times. You may need to restart
                    the app.
                  </Text>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  errorDetails: {
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'monospace',
  },
  stackTrace: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    maxHeight: 200,
    marginBottom: 20,
  },
  stackText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
  },
  actions: {
    marginTop: 20,
  },
  button: {
    marginBottom: 10,
  },
  warning: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;