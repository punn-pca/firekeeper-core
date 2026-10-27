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
  Modal,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { isTrustedNavigation } from './trustedNavigation';

const WEB_URL = 'https://firekeeper.site';
const LOCAL_ASSET_URL = 'file:///android_asset/web/index.html';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '272949249192-0e5fm9epp6qv5m0tv9rlsunf1fv7aunq.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '272949249192-ghjmo71cq4hgvi1b1pe1mdh22o6lrghn.apps.googleusercontent.com';

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
  const redirectUri = Platform.select({
    android: 'com.googleusercontent.apps.272949249192-ghjmo71cq4hgvi1b1pe1mdh22o6lrghn:/oauthredirect',
    default: AuthSession.makeRedirectUri({ scheme: 'firekeeperapp', path: 'oauthredirect' }),
  });
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });
  const webViewRef = useRef<WebView>(null);
  const popupWebViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUri, setCurrentUri] = useState(WEB_URL);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // In-App Authentication Popup State
  const [authPopupUrl, setAuthPopupUrl] = useState<string | null>(null);

  // Complete native Google OAuth by passing only the ID token to the trusted site.
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.params?.id_token;
      if (!idToken) {
        console.warn('[Native Google Auth] No ID token returned');
        return;
      }
      const tokenLiteral = JSON.stringify(idToken);
      webViewRef.current?.injectJavaScript(
        `(function(){var idToken=${tokenLiteral};window.dispatchEvent(new CustomEvent('firekeeper-native-google-token',{detail:{idToken:idToken}}));})();true;`
      );
    } else if (googleResponse?.type === 'error') {
      console.warn('[Native Google Auth] OAuth failed:', googleResponse.error?.message || 'unknown error');
    }
  }, [googleResponse]);

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
      // If auth popup is open, close popup first
      if (authPopupUrl) {
        setAuthPopupUrl(null);
        return true;
      }
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack, authPopupUrl]);

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

  // Dedicated safe area calculation for phone status bar (clock, battery, 5G, notch)
  const statusBarHeight = Platform.OS === 'android'
    ? (StatusBar.currentHeight || insets.top || 28)
    : insets.top;

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? keyboardHeight : 0 }]}>
      {/* Native device status bar: clean white clock and indicators on solid #060a16 */}
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="#060a16"
      />

      {/* Top Safe Area Bar: reserves dedicated space for the clock and status icons */}
      <View style={{ height: statusBarHeight, backgroundColor: '#060a16', width: '100%' }} />

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
        javaScriptCanOpenWindowsAutomatically={true}
        injectedJavaScriptBeforeContentLoaded={INJECTED_STICKY_HEADER_ONLY}
        onOpenWindow={(syntheticEvent) => {
          const { targetUrl } = syntheticEvent.nativeEvent;
          if (targetUrl) {
            console.log('[WebView onOpenWindow intercepted]:', targetUrl);
            setAuthPopupUrl(targetUrl);
          }
        }}
        onShouldStartLoadWithRequest={(request) => {
          // If the navigation target is trusted (Firekeeper or Google/Firebase OAuth), keep inside app
          if (isTrustedNavigation(request.url)) {
            return true;
          }
          // Only external third-party links open in external browser
          if (/^https?:\/\//i.test(request.url)) {
            void Linking.openURL(request.url).catch(() => {});
            return false;
          }
          return false;
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
            if (data.type === 'FIREKEEPER_GOOGLE_SIGN_IN') {
              if (!googleRequest) {
                console.warn('[Native Google Auth] Request is not ready yet');
                return;
              }
              void promptGoogleAsync();
            } else if (data.type === 'JS_ERROR') {
              console.warn('[WebView JS Error]:', data.message, data.url, data.line);
            }
          } catch {}
        }}
      />

      {/* In-App Authentication Popup Modal (Prevents launching external browser) */}
      <Modal
        visible={Boolean(authPopupUrl)}
        animationType="slide"
        onRequestClose={() => setAuthPopupUrl(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>เข้าสู่ระบบ (Sign In)</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setAuthPopupUrl(null);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.modalCloseButtonText}>✕ ปิด</Text>
            </TouchableOpacity>
          </View>

          {authPopupUrl && (
            <WebView
              ref={popupWebViewRef}
              source={{ uri: authPopupUrl }}
              style={styles.modalWebView}
              originWhitelist={['*']}
              userAgent={CHROME_USER_AGENT}
              javaScriptEnabled={true}
              javaScriptCanOpenWindowsAutomatically={true}
              domStorageEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              onShouldStartLoadWithRequest={(request) => {
                // This WebView exists only for the OAuth popup. Keep all HTTP(S)
                // provider redirects here; sending a redirect to an external app
                // can leave Firebase signInWithPopup waiting forever.
                if (isTrustedNavigation(request.url)) return true;
                if (/^https?:\/\//i.test(request.url)) return true;
                return false;
              }}
              // Keep OAuth redirects in the popup WebView. Returning to the app
              // origin alone does not prove Firebase completed authentication.
              onNavigationStateChange={(navState) => {
                console.log('[Auth WebView navigation]', navState.url, 'loading:', navState.loading);
              }}
              onError={(event) => {
                console.warn('[Auth WebView] Load error:', event.nativeEvent);
              }}
              onHttpError={(event) => {
                console.warn('[Auth WebView] HTTP error:', event.nativeEvent.statusCode, event.nativeEvent.url);
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

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
  modalContainer: {
    flex: 1,
    backgroundColor: '#060a16',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  modalWebView: {
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
