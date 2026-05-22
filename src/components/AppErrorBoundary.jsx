import React from 'react';
import { APP_VERSION, BUILD_CHANNEL, BUILD_DATE } from '../config/appConfig.js';

function makeErrorReport(error, info) {
  return [
    'Gruszka Katapulta crash report',
    `Version: ${APP_VERSION}`,
    `Build date: ${BUILD_DATE}`,
    `Channel: ${BUILD_CHANNEL}`,
    `URL: ${typeof window !== 'undefined' ? window.location.href : '-'}`,
    `User agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : '-'}`,
    `Message: ${error?.message || String(error || 'Unknown error')}`,
    `Stack: ${error?.stack || '-'}`,
    `Component stack: ${info?.componentStack || '-'}`,
  ].join('\n');
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    this.props.onError?.(error, info);
  }

  async copyReport() {
    const report = makeErrorReport(this.state.error, this.state.info);
    await navigator.clipboard?.writeText(report).catch(() => {});
    this.setState({ copied: true });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const showBuild = typeof window !== 'undefined' && new URLSearchParams(window.location.search).toString().match(/(^|&)(debug|playtest)=1/);
    return (
      <main className="app fatal-screen">
        <section className="fatal-card">
          <h1>Ups, gruszka wypadła z toru.</h1>
          <p>Coś poszło nie tak. Możesz odświeżyć grę albo skopiować raport błędu i wysłać go do White Raven Studio.</p>
          {showBuild && <small>{APP_VERSION} • {BUILD_DATE} • {BUILD_CHANNEL}</small>}
          <div className="menu-actions">
            <button className="primary-button" onClick={() => window.location.reload()}>Odśwież grę</button>
            <button className="secondary-button" onClick={() => this.copyReport()}>{this.state.copied ? 'Skopiowano' : 'Kopiuj raport błędu'}</button>
            <button className="secondary-button" onClick={() => { window.location.href = '/'; }}>Wróć do menu</button>
          </div>
        </section>
      </main>
    );
  }
}
