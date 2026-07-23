import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** What to show once the subtree has thrown. Defaults to nothing. */
  fallback?: ReactNode
  /** Fired once, when the first error is caught (e.g. to downgrade to lite). */
  onError?: (error: Error, info: ErrorInfo) => void
}
interface State {
  failed: boolean
}

/**
 * Render-error boundary. `Suspense` only covers the *loading* state of a lazy
 * chunk — a throw *inside* the 3D tree (WebGL init, shader/geometry error, model
 * decode) is not caught by it and would otherwise unmount the whole app to a
 * blank screen. This catches that throw and shows `fallback` instead; pair it
 * with `onError` to flip the session to the lite tier so the broken canvas is
 * never re-mounted.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
