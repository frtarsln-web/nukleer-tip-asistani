import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

// React.Component'in tip tanımlamalarını sağlamak için class içinde declare kullanıyoruz
export class ErrorBoundary extends React.Component<Props, State> {
    declare state: State;
    declare props: Props;
    declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center p-8">
                    <div className="max-w-md w-full space-y-6">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-red-400 mb-2">Bir Hata Oluştu</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Üzgünüz, bir şeyler yanlış gitti. Lütfen sayfayı yenilemeyi deneyin.
                            </p>
                            {this.state.error && (
                                <details className="mb-6 text-left">
                                    <summary className="text-xs font-black text-red-400/60 cursor-pointer hover:text-red-400 uppercase mb-2">
                                        Teknik Detaylar
                                    </summary>
                                    <pre className="text-[10px] bg-black/40 rounded-xl p-4 overflow-auto max-h-48 text-red-300/80 border border-red-500/10">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase transition-all"
                                >
                                    Tekrar Dene
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl text-xs font-black uppercase transition-all"
                                >
                                    Sayfayı Yenile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
