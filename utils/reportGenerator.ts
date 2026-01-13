import { DoseLogEntry, DoseUnit, DoseStatus } from '../types';

// PDF Report Generator using browser print
export const generatePDFReport = (
    history: DoseLogEntry[],
    unit: DoseUnit,
    reportType: 'daily' | 'weekly' | 'monthly' = 'daily',
    reportDate: Date = new Date()
) => {
    // Filter entries based on report type
    const filteredEntries = filterEntriesByType(history, reportType, reportDate);

    // Calculate statistics
    const stats = calculateStats(filteredEntries, unit);

    // Generate HTML content
    const htmlContent = generateReportHTML(filteredEntries, stats, unit, reportType, reportDate);

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

const filterEntriesByType = (
    history: DoseLogEntry[],
    reportType: 'daily' | 'weekly' | 'monthly',
    reportDate: Date
): DoseLogEntry[] => {
    const targetDate = new Date(reportDate);

    return history.filter(entry => {
        const entryDate = new Date(entry.timestamp);

        switch (reportType) {
            case 'daily':
                return entryDate.toDateString() === targetDate.toDateString();
            case 'weekly':
                const weekStart = new Date(targetDate);
                weekStart.setDate(targetDate.getDate() - targetDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return entryDate >= weekStart && entryDate <= weekEnd;
            case 'monthly':
                return entryDate.getMonth() === targetDate.getMonth() &&
                    entryDate.getFullYear() === targetDate.getFullYear();
            default:
                return true;
        }
    });
};

const calculateStats = (entries: DoseLogEntry[], unit: DoseUnit) => {
    const totalPatients = entries.length;
    const totalDose = entries.reduce((sum, e) => sum + e.amount, 0);
    const completedCount = entries.filter(e => e.status === DoseStatus.INJECTED).length;
    const pendingCount = entries.filter(e => e.status === DoseStatus.PREPARED).length;

    // Procedure breakdown
    const procedures: Record<string, { count: number; dose: number }> = {};
    entries.forEach(entry => {
        if (!procedures[entry.procedure]) {
            procedures[entry.procedure] = { count: 0, dose: 0 };
        }
        procedures[entry.procedure].count++;
        procedures[entry.procedure].dose += entry.amount;
    });

    // Hourly distribution
    const hourlyDistribution: number[] = new Array(24).fill(0);
    entries.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours();
        hourlyDistribution[hour]++;
    });

    // Average dose
    const avgDose = totalPatients > 0 ? totalDose / totalPatients : 0;

    return {
        totalPatients,
        totalDose,
        completedCount,
        pendingCount,
        procedures,
        hourlyDistribution,
        avgDose,
        completionRate: totalPatients > 0 ? (completedCount / totalPatients) * 100 : 0
    };
};

const generateReportHTML = (
    entries: DoseLogEntry[],
    stats: ReturnType<typeof calculateStats>,
    unit: DoseUnit,
    reportType: 'daily' | 'weekly' | 'monthly',
    reportDate: Date
): string => {
    const reportTypeLabels = {
        daily: 'Günlük',
        weekly: 'Haftalık',
        monthly: 'Aylık'
    };

    const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const procedureRows = Object.entries(stats.procedures)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([proc, data]) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${proc}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${data.count}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.dose.toFixed(2)} ${unit}</td>
      </tr>
    `).join('');

    const patientRows = entries
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((entry, idx) => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${entry.patientName}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${entry.procedure}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${entry.amount.toFixed(2)} ${unit}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          ${new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; ${entry.status === DoseStatus.INJECTED
                ? 'background: #d1fae5; color: #059669;'
                : 'background: #fef3c7; color: #d97706;'
            }">
            ${entry.status}
          </span>
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTypeLabels[reportType]} Rapor - ${formatDate(reportDate)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
    .header { 
      text-align: center; 
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { color: #1e40af; font-size: 24px; }
    .header p { color: #64748b; font-size: 14px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .stat-card .value { font-size: 28px; font-weight: 700; color: #0369a1; }
    .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .section { margin-bottom: 30px; }
    .section h2 { 
      font-size: 16px; 
      color: #1e40af; 
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { 
      background: #f1f5f9; 
      padding: 10px 8px; 
      text-align: left; 
      font-weight: 600;
      border-bottom: 2px solid #cbd5e1;
    }
    th.center { text-align: center; }
    th.right { text-align: right; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>☢️ Nükleer Tıp Departmanı</h1>
    <p>${reportTypeLabels[reportType]} Aktivite Raporu</p>
    <p style="font-weight: 600; color: #1e293b; margin-top: 5px;">${formatDate(reportDate)}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.totalPatients}</div>
      <div class="label">Toplam Hasta</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.totalDose.toFixed(1)}</div>
      <div class="label">Toplam ${unit}</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.completedCount}</div>
      <div class="label">Tamamlanan</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.completionRate.toFixed(0)}%</div>
      <div class="label">Başarı Oranı</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Prosedür Dağılımı</h2>
    <table>
      <thead>
        <tr>
          <th>Prosedür</th>
          <th class="center">Hasta Sayısı</th>
          <th class="right">Toplam Doz</th>
        </tr>
      </thead>
      <tbody>
        ${procedureRows || '<tr><td colspan="3" style="text-align:center; padding: 20px; color: #94a3b8;">Veri yok</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📋 Hasta Listesi</h2>
    <table>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Hasta Adı</th>
          <th>Prosedür</th>
          <th class="right">Doz</th>
          <th class="center">Saat</th>
          <th class="center">Durum</th>
        </tr>
      </thead>
      <tbody>
        ${patientRows || '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #94a3b8;">Veri yok</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Bu rapor ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
    <p>Nükleer Tıp Asistanı v1.0</p>
  </div>

  <button class="no-print" onclick="window.print()" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  ">
    🖨️ Yazdır / PDF Kaydet
  </button>
</body>
</html>
  `;
};

// Export as CSV
export const exportToCSV = (history: DoseLogEntry[], unit: DoseUnit, filename = 'rapor') => {
    const headers = ['Sıra', 'Hasta Adı', 'Protokol No', 'Prosedür', 'Doz', 'Birim', 'Tarih', 'Saat', 'Durum'];

    const rows = history.map((entry, idx) => [
        idx + 1,
        entry.patientName,
        entry.protocolNo || '-',
        entry.procedure,
        entry.amount.toFixed(2),
        unit,
        new Date(entry.timestamp).toLocaleDateString('tr-TR'),
        new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        entry.status
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

export default { generatePDFReport, exportToCSV };
