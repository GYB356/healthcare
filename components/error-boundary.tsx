"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-red-600">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              An error occurred while rendering this component. Please try again or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="font-mono text-sm text-red-600">
                  {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={this.handleReset}>Try Again</Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
} 