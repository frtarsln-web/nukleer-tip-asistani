import React, { useRef, useEffect, useState } from 'react';

interface QRCodeGeneratorProps {
    data: string;
    size?: number;
    title?: string;
    onClose?: () => void;
}

// Simple QR code generator using canvas (no external library needed)
// Uses a simple encoding for demonstration - in production use a library like 'qrcode'
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
    data,
    size = 200,
    title = 'QR Kod',
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    useEffect(() => {
        // Generate QR code using a simple pattern (for demo purposes)
        // In production, use a proper QR code library
        const generateQR = async () => {
            try {
                // Use the QR Code API
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
                setQrDataUrl(qrUrl);
            } catch (error) {
                console.error('QR generation error:', error);
            }
        };

        generateQR();
    }, [data, size]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            h1 { font-size: 24px; margin-bottom: 20px; }
            .data { font-size: 14px; color: #666; margin-top: 15px; word-break: break-all; max-width: 300px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <img src="${qrDataUrl}" width="${size}" height="${size}" />
          <p class="data">${data}</p>
        </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qr-${data.substring(0, 20)}.png`;
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* QR Code Display */}
                <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
                    {qrDataUrl ? (
                        <img src={qrDataUrl} width={size} height={size} alt="QR Code" className="rounded-lg" />
                    ) : (
                        <div className="w-[200px] h-[200px] bg-slate-200 rounded-lg animate-pulse flex items-center justify-center">
                            <span className="text-slate-400">Yükleniyor...</span>
                        </div>
                    )}
                </div>

                {/* Data Preview */}
                <p className="text-xs text-slate-500 text-center mb-4 break-all px-4">
                    {data}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Yazdır
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        İndir
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hook for generating patient QR codes
export const usePatientQR = () => {
    const [showQR, setShowQR] = useState(false);
    const [qrData, setQrData] = useState<{ data: string; title: string } | null>(null);

    const generatePatientQR = (patientId: string, patientName: string, procedure?: string) => {
        const data = JSON.stringify({
            id: patientId,
            name: patientName,
            procedure: procedure || '',
            timestamp: new Date().toISOString()
        });

        setQrData({
            data: `NT:${btoa(data)}`,
            title: `${patientName} - QR Kod`
        });
        setShowQR(true);
    };

    const closeQR = () => {
        setShowQR(false);
        setQrData(null);
    };

    return { showQR, qrData, generatePatientQR, closeQR };
};
