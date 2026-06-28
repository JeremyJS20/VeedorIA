import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  title?: string
}

interface State {
  hasError: boolean
  message: string
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`SectionErrorBoundary [${this.props.title ?? "unknown"}]:`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl bg-surface border border-outline-variant/20 p-6 text-center">
          <p className="text-sm font-semibold text-error mb-1">
            Error al cargar {this.props.title ?? "esta sección"}
          </p>
          <p className="text-xs text-outline">{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
