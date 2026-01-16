import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceCommand {
    pattern: RegExp;
    action: string;
    description: string;
}

// Predefined voice commands for nuclear medicine workflow
const VOICE_COMMANDS: VoiceCommand[] = [
    {
        pattern: /doz çekildi|doz çekiyor/i,
        action: 'DOSE_WITHDRAWN',
        description: 'Doz çekim işlemini başlatır'
    },
    {
        pattern: /hasta.*oda.*(\d+)|oda.*(\d+).*hasta/i,
        action: 'ASSIGN_ROOM',
        description: 'Hastayı belirtilen odaya atar'
    },
    {
        pattern: /çekime al|çekim başla/i,
        action: 'START_IMAGING',
        description: 'Hastayı çekime alır'
    },
    {
        pattern: /çekim.*bitti|tamamlandı/i,
        action: 'FINISH_IMAGING',
        description: 'Çekimi tamamlar'
    },
    {
        pattern: /ek çekim|gecikmeli çekim/i,
        action: 'ADDITIONAL_IMAGING',
        description: 'Ek çekim talep eder'
    },
    {
        pattern: /stok.*ne kadar|aktivite.*ne kadar/i,
        action: 'CHECK_STOCK',
        description: 'Mevcut stok durumunu söyler'
    },
    {
        pattern: /bekleyen.*hasta|kaç hasta/i,
        action: 'CHECK_PATIENTS',
        description: 'Bekleyen hasta sayısını söyler'
    },
    {
        pattern: /yardım|komutlar/i,
        action: 'HELP',
        description: 'Kullanılabilir komutları listeler'
    }
];

interface UseVoiceCommandsOptions {
    onCommand?: (action: string, transcript: string) => void;
    onError?: (error: string) => void;
    language?: string;
}

interface UseVoiceCommandsReturn {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    toggleListening: () => void;
    commands: VoiceCommand[];
}

export const useVoiceCommands = (options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn => {
    const { onCommand, onError, language = 'tr-TR' } = options;

    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                setIsListening(false);
                if (onError) {
                    onError(event.error);
                }
            };

            recognition.onresult = (event: any) => {
                const lastResult = event.results[event.results.length - 1];
                const text = lastResult[0].transcript;
                setTranscript(text);

                if (lastResult.isFinal && onCommand) {
                    // Check for matching commands
                    for (const command of VOICE_COMMANDS) {
                        if (command.pattern.test(text)) {
                            onCommand(command.action, text);
                            break;
                        }
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [language, onCommand, onError]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Recognition start error:', error);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        isSupported,
        transcript,
        startListening,
        stopListening,
        toggleListening,
        commands: VOICE_COMMANDS
    };
};

// Text-to-speech utility for feedback
export const speak = (text: string, lang = 'tr-TR'): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!('speechSynthesis' in window)) {
            reject(new Error('Speech synthesis not supported'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(event.error);

        window.speechSynthesis.speak(utterance);
    });
};

// Voice feedback component
interface VoiceButtonProps {
    onCommand: (action: string, transcript: string) => void;
    className?: string;
}

export const VoiceCommandButton: React.FC<VoiceButtonProps> = ({ onCommand, className = '' }) => {
    const { isListening, isSupported, transcript, toggleListening, commands } = useVoiceCommands({
        onCommand,
        onError: (error) => console.error('Voice error:', error)
    });

    const [showHelp, setShowHelp] = useState(false);

    if (!isSupported) {
        return null; // Don't show if not supported
    }

    return (
        <>
            <button
                onClick={toggleListening}
                className={`relative p-3 rounded-xl transition-all ${isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                    } ${className}`}
                title={isListening ? 'Dinlemeyi Durdur' : 'Sesli Komut'}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={isListening
                            ? "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                            : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        }
                    />
                </svg>

                {isListening && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
                )}
            </button>

            {/* Transcript Display */}
            {isListening && transcript && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl px-6 py-3 shadow-2xl z-50">
                    <p className="text-white font-bold text-center">{transcript}</p>
                </div>
            )}

            {/* Listening Indicator */}
            {isListening && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-xl rounded-full px-6 py-3 shadow-2xl z-50 flex items-center gap-3">
                    <div className="flex gap-1">
                        <span className="w-2 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-6 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-white font-bold text-sm">Dinleniyor...</span>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            🎤 Sesli Komutlar
                        </h3>
                        <div className="space-y-2">
                            {commands.map((cmd, i) => (
                                <div key={i} className="bg-slate-800/50 rounded-xl p-3">
                                    <p className="text-sm font-bold text-purple-400">"{cmd.pattern.source.replace(/[\\|()]/g, ' ').trim()}"</p>
                                    <p className="text-xs text-slate-500 mt-1">{cmd.description}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowHelp(false)}
                            className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

import React from 'react';
