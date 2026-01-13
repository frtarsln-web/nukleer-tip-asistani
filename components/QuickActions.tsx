import React, { useState } from 'react';

interface QuickAction {
    id: string;
    label: string;
    icon: string;
    color: string;
    onClick: () => void;
}

interface QuickActionsProps {
    onNewPatient?: () => void;
    onOpenReports?: () => void;
    onOpenAnalytics?: () => void;
    onOpenSettings?: () => void;
    onOpenHandbook?: () => void;
    onOpenWaste?: () => void;
    onOpenProtocols?: () => void;
    onOpenFDGPlanner?: () => void;
    onOpenFDGTracker?: () => void;
    isExpanded?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    onNewPatient,
    onOpenReports,
    onOpenAnalytics,
    onOpenSettings,
    onOpenHandbook,
    onOpenWaste,
    onOpenProtocols,
    onOpenFDGPlanner,
    onOpenFDGTracker,
    isExpanded: initialExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);

    const actions: QuickAction[] = [
        {
            id: 'new-patient',
            label: 'Yeni Hasta',
            icon: '👤',
            color: 'from-blue-500 to-cyan-500',
            onClick: onNewPatient || (() => { })
        },
        {
            id: 'protocols',
            label: 'Protokoller',
            icon: '📋',
            color: 'from-indigo-500 to-purple-500',
            onClick: onOpenProtocols || (() => { })
        },
        {
            id: 'fdg-planner',
            label: 'FDG Sipariş',
            icon: '📦',
            color: 'from-orange-500 to-amber-500',
            onClick: onOpenFDGPlanner || (() => { })
        },
        {
            id: 'fdg-tracker',
            label: 'Aktivite Takip',
            icon: '📊',
            color: 'from-cyan-500 to-blue-500',
            onClick: onOpenFDGTracker || (() => { })
        },
        {
            id: 'reports',
            label: 'Raporlar',
            icon: '📊',
            color: 'from-emerald-500 to-teal-500',
            onClick: onOpenReports || (() => { })
        },
        {
            id: 'analytics',
            label: 'Analitik',
            icon: '📈',
            color: 'from-purple-500 to-pink-500',
            onClick: onOpenAnalytics || (() => { })
        },
        {
            id: 'handbook',
            label: 'El Kitabı',
            icon: '📖',
            color: 'from-amber-500 to-orange-500',
            onClick: onOpenHandbook || (() => { })
        },
        {
            id: 'waste',
            label: 'Atık Takip',
            icon: '♻️',
            color: 'from-rose-500 to-red-500',
            onClick: onOpenWaste || (() => { })
        },
        {
            id: 'settings',
            label: 'Ayarlar',
            icon: '⚙️',
            color: 'from-slate-500 to-slate-600',
            onClick: onOpenSettings || (() => { })
        }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Action Buttons - Shown when expanded */}
            {isExpanded && (
                <div className="flex flex-col gap-2 animate-slide-up">
                    {actions.map((action, index) => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            onMouseEnter={() => setHoveredAction(action.id)}
                            onMouseLeave={() => setHoveredAction(null)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-2xl
                                bg-gradient-to-r ${action.color}
                                text-white font-bold text-sm
                                shadow-lg hover:shadow-xl
                                transform transition-all duration-300
                                hover:scale-105 active:scale-95
                                animate-slide-up
                            `}
                            style={{
                                animationDelay: `${index * 50}ms`,
                                opacity: 0,
                                animationFillMode: 'forwards'
                            }}
                        >
                            <span className="text-xl">{action.icon}</span>
                            <span className={`
                                transition-all duration-200
                                ${hoveredAction === action.id ? 'translate-x-1' : ''}
                            `}>
                                {action.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    w-16 h-16 rounded-full
                    bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600
                    text-white text-2xl
                    shadow-lg shadow-purple-500/30
                    flex items-center justify-center
                    transition-all duration-300
                    hover:scale-110 active:scale-95
                    animate-glow
                    ${isExpanded ? 'rotate-45' : ''}
                `}
            >
                <span className={`
                    transition-transform duration-300
                    ${isExpanded ? 'rotate-45' : ''}
                `}>
                    {isExpanded ? '✕' : '⚡'}
                </span>
            </button>

            {/* Floating Label */}
            {!isExpanded && (
                <div className="absolute bottom-20 right-0 whitespace-nowrap">
                    <span className="
                        px-3 py-1.5 rounded-lg
                        bg-black/80 backdrop-blur-sm
                        text-white text-xs font-bold
                        animate-bounce-soft
                    ">
                        Hızlı İşlemler
                    </span>
                </div>
            )}
        </div>
    );
};

export default QuickActions;
