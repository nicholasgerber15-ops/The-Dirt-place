UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6 text-[#D9A441]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Oops!</div>
            <h2 className="text-2xl font-bold text-[#3B2F2F] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Something went wrong
            </h2>
            <p className="text-[#6B4F3F] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="px-8 py-3 bg-[#D9A441] text-[#3B2F2F] font-bold rounded hover:bg-[#3B2F2F] hover:text-white transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
