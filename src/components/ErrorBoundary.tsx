import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
                    <div className="glass-card rounded-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                        </div>

                        <h1 className="text-xl font-bold text-foreground mb-2">
                            خطایی رخ داده است
                        </h1>

                        <p className="text-muted-foreground mb-6">
                            متأسفانه مشکلی در برنامه پیش آمده است. لطفاً صفحه را رفرش کنید یا به صفحه اصلی بروید.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-muted rounded-lg p-4 mb-6 text-right">
                                <p className="text-sm font-mono text-destructive mb-2">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-xs text-muted-foreground overflow-auto max-h-32">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={this.handleReload}
                                className="bg-forest-medium hover:bg-forest-deep"
                            >
                                <RefreshCcw className="w-4 h-4 ml-2" />
                                رفرش صفحه
                            </Button>
                            <Button
                                variant="outline"
                                onClick={this.handleHome}
                            >
                                <Home className="w-4 h-4 ml-2" />
                                صفحه اصلی
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
