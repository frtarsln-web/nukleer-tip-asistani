import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Isotope, DoseUnit, PendingPatient } from '../types';
import { ISOTOPES, COLD_KITS } from '../constants';

interface AIAssistantProps {
    onClose: () => void;
    selectedIsotope: Isotope;
    unit: DoseUnit;
    pendingPatients: PendingPatient[];
    currentStock: number;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const translations = {
    tr: {
        title: 'AI Asistan',
        subtitle: 'Nükleer tıp danışmanınız',
        greeting: 'Merhaba! Ben nükleer tıp asistanınızım. Size nasıl yardımcı olabilirim?',
        askQuestion: 'Soru sorun veya yardım isteyin...',
        typing: 'Yazıyor...',
        send: 'Gönder',
        suggestions: 'Öneri',
        quickQuestions: [
            'Stok durumu nedir?',
            'Bekleyen hastalar kimler?',
            'FDG için doz öner',
            'MDP kit nasıl hazırlanır?',
            'Tc-99m yarı ömrü nedir?',
            'Prosedür protokolü ver',
            'QC hatırlatması',
            'Radyasyon güvenliği',
        ],
        quickQuestionsEn: [
            'What is stock status?',
            'Who are waiting patients?',
            'Suggest dose for FDG',
            'How to prepare MDP kit?',
            'What is Tc-99m half-life?',
            'Give procedure protocol',
            'QC reminder',
            'Radiation safety',
        ],
    },
    en: {
        title: 'AI Assistant',
        subtitle: 'Your nuclear medicine consultant',
        greeting: 'Hello! I am your nuclear medicine assistant. How can I help you?',
        askQuestion: 'Ask a question or request help...',
        typing: 'Typing...',
        send: 'Send',
        suggestions: 'Suggestions',
        quickQuestions: [
            'What is stock status?',
            'Who are waiting patients?',
            'Suggest dose for FDG',
            'How to prepare MDP kit?',
            'What is Tc-99m half-life?',
            'Give procedure protocol',
            'QC reminder',
            'Radiation safety',
        ],
        quickQuestionsEn: [
            'What is stock status?',
            'Who are waiting patients?',
            'Suggest dose for FDG',
            'How to prepare MDP kit?',
            'What is Tc-99m half-life?',
            'Give procedure protocol',
            'QC reminder',
            'Radiation safety',
        ],
    },
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
    onClose,
    selectedIsotope,
    unit,
    pendingPatients,
    currentStock,
}) => {
    const lang = useMemo(() => {
        try {
            const settings = localStorage.getItem('nt_app_settings');
            if (settings) return JSON.parse(settings).language || 'tr';
        } catch { }
        return 'tr';
    }, []);

    const t = translations[lang as 'tr' | 'en'];
    const quickQs = lang === 'en' ? t.quickQuestionsEn : t.quickQuestions;

    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: t.greeting, timestamp: new Date() },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const generateResponse = (query: string): string => {
        const q = query.toLowerCase();
        const isEn = lang === 'en';

        // Stock status
        if (q.includes('stok') || q.includes('stock') || q.includes('mevcut') || q.includes('current') || q.includes('aktivite') || q.includes('activity')) {
            return isEn
                ? `📦 **Current Stock Status**\n\n**${selectedIsotope.symbol} (${selectedIsotope.name})**: ${currentStock.toFixed(2)} ${unit}\n\nHalf-life: ${selectedIsotope.halfLifeHours.toFixed(2)} hours`
                : `📦 **Mevcut Stok Durumu**\n\n**${selectedIsotope.symbol} (${selectedIsotope.name})**: ${currentStock.toFixed(2)} ${unit}\n\nYarı ömür: ${selectedIsotope.halfLifeHours.toFixed(2)} saat`;
        }

        // Waiting patients
        if (q.includes('bekleyen') || q.includes('hasta') || q.includes('waiting') || q.includes('patient') || q.includes('queue') || q.includes('sıra')) {
            if (pendingPatients.length === 0) {
                return isEn ? '👤 There are currently **no waiting patients**.' : '👤 Şu anda **bekleyen hasta bulunmuyor**.';
            }
            const list = pendingPatients.slice(0, 5).map((p, i) =>
                `${i + 1}. **${p.name}**${p.procedure ? ` - ${p.procedure}` : ''}${p.appointmentTime ? ` (${p.appointmentTime})` : ''}`
            ).join('\n');
            return isEn
                ? `👤 **Waiting Patients (${pendingPatients.length})**\n\n${list}${pendingPatients.length > 5 ? `\n\n... and ${pendingPatients.length - 5} more` : ''}`
                : `👤 **Bekleyen Hastalar (${pendingPatients.length})**\n\n${list}${pendingPatients.length > 5 ? `\n\n... ve ${pendingPatients.length - 5} hasta daha` : ''}`;
        }

        // Dose recommendation
        if (q.includes('doz') || q.includes('dose') || q.includes('öner') || q.includes('suggest') || q.includes('recommend')) {
            const iso = ISOTOPES.find(i => q.includes(i.id) || q.includes(i.name.toLowerCase()) || q.includes(i.symbol.toLowerCase())) || selectedIsotope;
            const procs = iso.commonProcedures || [];
            if (procs.length === 0) {
                return isEn ? `💊 No common procedures defined for **${iso.name}**.` : `💊 **${iso.name}** için tanımlı yaygın prosedür yok.`;
            }
            return isEn
                ? `💊 **Dose Recommendations for ${iso.symbol}**\n\n${procs.slice(0, 3).map(p => `• **${p}**: 5-15 ${unit} (consult protocol)`).join('\n')}\n\n⚠️ These are general ranges. Always follow institutional protocols.`
                : `💊 **${iso.symbol} Doz Önerileri**\n\n${procs.slice(0, 3).map(p => `• **${p}**: 5-15 ${unit} (protokole bakınız)`).join('\n')}\n\n⚠️ Bunlar genel aralıklardır. Her zaman kurumsal protokolleri takip edin.`;
        }

        // Kit preparation
        if (q.includes('kit') || q.includes('hazırla') || q.includes('prepare') || q.includes('hazırlık') || q.includes('preparation')) {
            const kit = COLD_KITS.find(k => q.includes(k.name.toLowerCase())) || COLD_KITS[0];
            if (!kit) {
                return isEn ? '🧪 I could not find information about this kit.' : '🧪 Bu kit hakkında bilgi bulamadım.';
            }
            return isEn
                ? `🧪 **${kit.name} Kit Preparation**\n\n${kit.preparationSteps?.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'No steps available.'}\n\n⏱️ Incubation: ${kit.incubationTime || 15} min\n🌡️ Storage: ${kit.storageTemp || 'Room temperature'}`
                : `🧪 **${kit.name} Kit Hazırlığı**\n\n${kit.preparationSteps?.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Adım bilgisi yok.'}\n\n⏱️ İnkübasyon: ${kit.incubationTime || 15} dk\n🌡️ Saklama: ${kit.storageTemp || 'Oda sıcaklığı'}`;
        }

        // Half-life
        if (q.includes('yarı ömür') || q.includes('half-life') || q.includes('halflife') || q.includes('yarı-ömür') || q.includes('t1/2')) {
            const iso = ISOTOPES.find(i => q.includes(i.id) || q.includes(i.name.toLowerCase()) || q.includes(i.symbol.toLowerCase())) || selectedIsotope;
            return isEn
                ? `⏱️ **${iso.symbol} Half-Life**\n\n• Physical half-life: **${iso.halfLifeHours.toFixed(2)} hours** (${(iso.halfLifeHours / 24).toFixed(2)} days)\n• After 1 half-life: 50% remaining\n• After 2 half-lives: 25% remaining\n• After 10 half-lives: ~0.1% remaining`
                : `⏱️ **${iso.symbol} Yarı Ömrü**\n\n• Fiziksel yarı ömür: **${iso.halfLifeHours.toFixed(2)} saat** (${(iso.halfLifeHours / 24).toFixed(2)} gün)\n• 1 yarı ömür sonra: %50 kalır\n• 2 yarı ömür sonra: %25 kalır\n• 10 yarı ömür sonra: ~%0.1 kalır`;
        }

        // Protocol
        if (q.includes('protokol') || q.includes('protocol') || q.includes('prosedür') || q.includes('procedure')) {
            const iso = selectedIsotope;
            const protocols = iso.imagingProtocols || {};
            const protocolList = Object.entries(protocols).slice(0, 3);
            if (protocolList.length === 0) {
                return isEn
                    ? `📋 **${iso.symbol} Protocols**\n\nNo specific protocols defined. Common procedures:\n${(iso.commonProcedures || []).slice(0, 5).map(p => `• ${p}`).join('\n')}`
                    : `📋 **${iso.symbol} Protokolleri**\n\nTanımlı özel protokol yok. Yaygın prosedürler:\n${(iso.commonProcedures || []).slice(0, 5).map(p => `• ${p}`).join('\n')}`;
            }
            return isEn
                ? `📋 **${iso.symbol} Imaging Protocols**\n\n${protocolList.map(([name, desc]) => `**${name}**\n${desc}`).join('\n\n')}`
                : `📋 **${iso.symbol} Görüntüleme Protokolleri**\n\n${protocolList.map(([name, desc]) => `**${name}**\n${desc}`).join('\n\n')}`;
        }

        // QC
        if (q.includes('qc') || q.includes('kalite') || q.includes('quality') || q.includes('kontrol') || q.includes('control')) {
            return isEn
                ? `🔬 **Quality Control Reminder**\n\n**Daily QC:**\n• Dose calibrator constancy\n• Gamma camera uniformity\n• Background measurement\n• Contamination check\n\n**Weekly QC:**\n• Spatial resolution\n• Energy resolution\n• Linearity test\n\n⚠️ Document all QC results!`
                : `🔬 **Kalite Kontrol Hatırlatması**\n\n**Günlük QC:**\n• Doz kalibratör constancy\n• Gamma kamera uniformite\n• Background ölçümü\n• Kontaminasyon kontrolü\n\n**Haftalık QC:**\n• Spatial rezolüsyon\n• Enerji rezolüsyonu\n• Linearity testi\n\n⚠️ Tüm QC sonuçlarını kaydedin!`;
        }

        // Radiation safety
        if (q.includes('radyasyon') || q.includes('radiation') || q.includes('güvenlik') || q.includes('safety') || q.includes('koruma') || q.includes('protection')) {
            return isEn
                ? `☢️ **Radiation Safety Principles**\n\n**ALARA (As Low As Reasonably Achievable)**\n\n• **Time**: Minimize exposure time\n• **Distance**: Stay as far as possible\n• **Shielding**: Use lead shields\n\n**Personal Dosimetry:**\n• Wear TLD/OSL badges\n• Check monthly dose reports\n• Annual limit: 50 mSv (occupational)\n\n🧤 Always wear gloves when handling radioactive materials!`
                : `☢️ **Radyasyon Güvenliği İlkeleri**\n\n**ALARA (Makul Ölçüde Düşük Tutun)**\n\n• **Zaman**: Maruz kalma süresini azaltın\n• **Mesafe**: Mümkün olduğunca uzak durun\n• **Kalkan**: Kurşun koruma kullanın\n\n**Kişisel Dozimetri:**\n• TLD/OSL rozeti takın\n• Aylık doz raporlarını kontrol edin\n• Yıllık limit: 50 mSv (mesleki)\n\n🧤 Radyoaktif maddelerle çalışırken her zaman eldiven giyin!`;
        }

        // Default response
        return isEn
            ? `I can help you with:\n\n• 📦 Stock status\n• 👤 Waiting patients\n• 💊 Dose recommendations\n• 🧪 Kit preparation\n• ⏱️ Half-life information\n• 📋 Procedure protocols\n• 🔬 QC reminders\n• ☢️ Radiation safety\n\nFeel free to ask!`
            : `Size şu konularda yardımcı olabilirim:\n\n• 📦 Stok durumu\n• 👤 Bekleyen hastalar\n• 💊 Doz önerileri\n• 🧪 Kit hazırlığı\n• ⏱️ Yarı ömür bilgisi\n• 📋 Prosedür protokolleri\n• 🔬 QC hatırlatmaları\n• ☢️ Radyasyon güvenliği\n\nSormak istediğiniz her şeyi sorabilirsiniz!`;
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const response = generateResponse(userMessage.content);
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, 500 + Math.random() * 1000);
    };

    const handleQuickQuestion = (q: string) => {
        setInput(q);
        setTimeout(() => {
            const userMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: q,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);
            setIsTyping(true);

            setTimeout(() => {
                const response = generateResponse(q);
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: response,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsTyping(false);
                setInput('');
            }, 500 + Math.random() * 1000);
        }, 100);
    };

    const formatMessage = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden border border-slate-700 flex flex-col">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🤖</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t.title}</h2>
                            <p className="text-cyan-200 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-cyan-600 text-white rounded-br-sm'
                                    : 'bg-slate-700 text-slate-200 rounded-bl-sm'
                                }`}>
                                <div
                                    className="text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                />
                                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-cyan-200' : 'text-slate-500'}`}>
                                    {msg.timestamp.toLocaleTimeString(lang === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick questions */}
                <div className="px-4 py-2 border-t border-slate-700">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t.suggestions}</p>
                    <div className="flex flex-wrap gap-1">
                        {quickQs.slice(0, 4).map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleQuickQuestion(q)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={t.askQuestion}
                            className="flex-1 px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 border border-slate-600 focus:border-cyan-500 outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
                        >
                            {t.send}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
