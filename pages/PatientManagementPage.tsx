import React from 'react';

// Placeholder page - will be filled with actual content from existing components
const PatientManagementPage: React.FC = () => {
    return (
        <div className="p-4 md:p-6">
            <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 mb-6">
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <span>👥</span> Hasta Yönetimi
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Hasta kayıt, takip ve doz uygulama işlemleri
                </p>
            </div>

            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-12 text-center">
                <p className="text-6xl mb-4">🚧</p>
                <p className="text-lg font-bold text-white mb-2">Sayfa Hazırlanıyor</p>
                <p className="text-sm text-slate-500">
                    Bu sayfa mevcut bileşenlerle entegre edilecek
                </p>
            </div>
        </div>
    );
};

export default PatientManagementPage;
