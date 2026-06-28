import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    localStorage.removeItem('paynest-storage')
    localStorage.removeItem('paynest-auth')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'Inter, sans-serif', color: '#F1F5F9', background: '#0A0E1A', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ background: '#1A2234', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, marginBottom: 16 }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={this.handleReset}
            style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            Clear local data &amp; reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
