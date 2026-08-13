import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#f8fafc', backgroundColor: '#0f172a', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#f43f5e', fontSize: '1.25rem', fontWeight: 'bold' }}>เกิดข้อผิดพลาดในการแสดงผล (Application Error)</h2>
          <p style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            {this.state.error?.message || 'โปรดลองรีเฟรชหน้าเว็บใหม่อีกครั้ง'}
          </p>
          <div className="flex items-center gap-3" style={{ marginTop: '1.25rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              🔄 รีเฟรชหน้าเว็บ
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ padding: '0.6rem 1.2rem', background: '#e11d48', color: '#fff', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              🧹 ล้างข้อมูลแคชและเริ่มต้นใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

