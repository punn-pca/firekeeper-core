import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  Platform,
  StatusBar,
  Linking,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

const WEB_URL = 'https://firekeeper.site';
const LOCAL_ASSET_URL = 'file:///android_asset/web/index.html';

// Desktop/Mobile Chrome User-Agent so Firebase & Google OAuth never block with "disallowed_useragent"
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

// Injected CSS: Pin ONLY the top header menu, all other content scrolls 100% naturally
const INJECTED_STICKY_HEADER_ONLY = `
(function() {
  const style = document.createElement('style');
  style.id = 'fk-sticky-menu-bar';
  style.innerHTML = \`
    header {
      position: sticky !important;
      top: 0px !important;
      z-index: 50 !important;
      background-color: rgba(6, 10, 22, 0.95) !important;
      -webkit-backdrop-filter: blur(16px) !important;
      backdrop-filter: blur(16px) !important;
    }
  \`;
  document.head.appendChild(style);

  // Global error bridge for logging
  window.onerror = function(msg, url, lineNo) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'JS_ERROR',
        message: String(msg),
        url: String(url),
        line: lineNo
      }));
    }
    return false;
  };
})();
true;
`;

export default function WebFirekeeperScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUri, setCurrentUri] = useState(LOCAL_ASSET_URL);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Dynamic Keyboard Inset Handling for Android WebView
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 0;
      setKeyboardHeight(height);
    };

    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Handle Android Hardware Back Button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);

    // Auto recover if accidentally redirected to about:blank
    if (navState.url === 'about:blank') {
      webViewRef.current?.injectJavaScript(`window.location.href = "${LOCAL_ASSET_URL}"; true;`);
    }

    if (!navState.loading) {
      setIsInitialLoading(false);
    }
  }, []);

  const handleReload = () => {
    setHasError(false);
    setIsInitialLoading(true);
    webViewRef.current?.reload();
  };

  const handleUseLocalBundle = () => {
    setHasError(false);
    setIsInitialLoading(true);
    setCurrentUri(LOCAL_ASSET_URL);
  };

  const handleUseOnline = () => {
    setHasError(false);
    setIsInitialLoading(true);
    setCurrentUri(WEB_URL);
  };

  // Status bar handling: iOS uses inset top; Android uses native non-translucent status bar
  const topInset = Platform.OS === 'ios' ? insets.top : 0;

  return (
    <View style={[styles.container, { paddingTop: topInset, paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0 }]}>
      {/* Native device status bar: crisp white clock and icons on solid dark background */}
      <StatusBar
        barStyle="light-content"
        translucent={false}
        backgroundColor="#060a16"
      />

      {/* Main WebView Rendering firekeeper-core */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUri }}
        style={styles.webview}
        containerStyle={styles.webviewContainer}
        originWhitelist={['*']}
        userAgent={CHROME_USER_AGENT}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        allowsFullscreenVideo={true}
        cacheEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={true}
        injectedJavaScriptBeforeContentLoaded={INJECTED_STICKY_HEADER_ONLY}
        onShouldStartLoadWithRequest={(request) => {
          // Block about:blank from replacing the main page and causing black screen
          if (request.url === 'about:blank') {
            return false;
          }
          return true;
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setHasError(false)}
        onLoadEnd={() => setIsInitialLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('[WebView] Load error:', nativeEvent);
          if (isInitialLoading) {
            setHasError(true);
            setErrorMessage(nativeEvent.description || 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้');
          }
          setIsInitialLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('[WebView] HTTP error:', nativeEvent.statusCode);
          if (nativeEvent.statusCode >= 500 && isInitialLoading) {
            setHasError(true);
            setErrorMessage(`Server status ${nativeEvent.statusCode}`);
          }
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'JS_ERROR') {
              console.warn('[WebView JS Error]:', data.message, data.url, data.line);
            }
          } catch {}
        }}
      />

      {/* Initial Cold Start Splash Only - Never covers screen during in-page actions or login */}
      {isInitialLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.flameContainer}>
            <Text style={styles.flameEmoji}>🔥</Text>
            <ActivityIndicator size="large" color="#ff8a00" style={styles.spinner} />
          </View>
          <Text style={styles.loadingBrand}>FIRE KEEPER</Text>
          <Text style={styles.loadingSub}>PREDICTIVE COGNITIVE ARCHITECTURE</Text>
        </View>
      )}

      {/* Error / Offline Screen */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorIcon}>⚡</Text>
          <Text style={styles.errorTitle}>ไม่สามารถโหลดหน้าเว็บได้</Text>
          <Text style={styles.errorDesc}>
            {errorMessage || 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ'}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleReload}>
              <Text style={styles.primaryButtonText}>🔄 ลองใหม่อีกครั้ง</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleUseLocalBundle}>
              <Text style={styles.secondaryButtonText}>📦 เปิดไฟล์ในเครื่อง (Local)</Text>
            </TouchableOpacity>
          </View>

          {currentUri !== WEB_URL && (
            <TouchableOpacity style={styles.textButton} onPress={handleUseOnline}>
              <Text style={styles.textButtonText}>🌐 สลับกลับเป็นโหมดออนไลน์</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a16',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#060a16',
  },
  webview: {
    flex: 1,
    backgroundColor: '#060a16',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#060a16',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flameContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  flameEmoji: {
    fontSize: 36,
  },
  spinner: {
    position: 'absolute',
    transform: [{ scale: 1.4 }],
  },
  loadingBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 6,
  },
  loadingSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ff8a00',
    letterSpacing: 1.5,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#060a16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    backgroundColor: '#ff8a00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  textButton: {
    marginTop: 16,
    padding: 8,
  },
  textButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
