import { DoseLogEntry, WasteBin, Isotope, DoseUnit } from '../types';

/**
 * Enhanced export utilities for Excel and PDF generation
 */

// CSV export (already exists in export.ts, kept for compatibility)
export function exportToCSV(data: DoseLogEntry[], isotopeName: string) {
  const headers = ['Sıra', 'Hasta', 'Protokol No', 'Prosedür', 'Aktivite', 'Birim', 'Durum', 'Tarih/Saat', 'Hazırlayan'];
  const rows = data.map((entry, idx) => [
    data.length - idx,
    entry.patientName,
    entry.protocolNo || 'N/A',
    entry.procedure,
    entry.amount.toFixed(2),
    entry.unit,
    entry.status,
    new Date(entry.timestamp).toLocaleString('tr-TR'),
    entry.preparedBy?.name || 'N/A'
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${isotopeName}_Hasta_Kayitlari_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

/**
 * Export to Excel with formatting (requires xlsx library)
 * Note: This is a mock implementation. In production, you'd need to install xlsx package
 */
export function exportToExcel(data: DoseLogEntry[], isotopeName: string) {
  // This would use the 'xlsx' library in a real implementation
  // For now, we'll fallback to CSV
  console.warn('Excel export requires xlsx library. Falling back to CSV.');
  exportToCSV(data, isotopeName);
}

/**
 * Generate printable HTML report
 */
export function generatePrintableReport(
  history: DoseLogEntry[],
  wasteBins: WasteBin[],
  isotope: Isotope,
  unit: DoseUnit,
  stats: { injectedCount: number; preparedCount: number; totalInjected: number }
): string {
  const now = new Date().toLocaleString('tr-TR');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${isotope.name} - Günlük Rapor</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: 'Segoe UI', sans-serif; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
          }
          body { background: white; color: black; }
          h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #0f172a; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          tr:nth-child(even) { background: #f8fafc; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; }
          .stat-card.orange { background: #fff7ed; border-color: #f97316; }
          .stat-card.orange .stat-value { color: #ea580c; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .stat-value { font-size: 28px; font-weight: bold; color: #1e40af; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .metadata { color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>🏥 Nükleer Tıp Günlük Raporu</h1>
            <div class="metadata">
              <strong>İzotop:</strong> ${isotope.name} (${isotope.symbol})<br>
              <strong>Rapor Tarihi:</strong> ${now}
            </div>
          </div>
        </div>

        <h2>📊 İstatistikler</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Uygulanan</div>
            <div class="stat-value">${stats.injectedCount}</div>
            <div class="stat-label">Hasta</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Hazırlanan</div>
            <div class="stat-value">${stats.preparedCount}</div>
            <div class="stat-label">Doz</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Toplam Aktivite</div>
            <div class="stat-value">${stats.totalInjected.toFixed(0)}</div>
            <div class="stat-label">${unit}</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-label">Ek Çekim</div>
            <div class="stat-value">${history.filter(h => h.additionalInfo?.region).length}</div>
            <div class="stat-label">Hasta</div>
          </div>
        </div>

        <h2>👥 Hasta Listesi</h2>
        <table>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Hasta</th>
              <th>Protokol</th>
              <th>Prosedür</th>
              <th>Aktivite</th>
              <th>Ek Çekim</th>
              <th>Durum</th>
              <th>Tarih/Saat</th>
              <th>Hazırlayan</th>
            </tr>
          </thead>
          <tbody>
            ${history.map((entry, idx) => `
              <tr>
                <td>${history.length - idx}</td>
                <td><strong>${entry.patientName}</strong></td>
                <td>${entry.protocolNo || '-'}</td>
                <td>${entry.procedure}</td>
                <td>${entry.amount.toFixed(2)} ${unit}</td>
                <td>${entry.additionalInfo?.region ? `📸 ${entry.additionalInfo.region}` : '-'}</td>
                <td>${entry.status}</td>
                <td>${new Date(entry.timestamp).toLocaleString('tr-TR')}</td>
                <td>${entry.preparedBy?.name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="page-break"></div>

        <h2>🗑️ Atık Yönetimi</h2>
        ${wasteBins.map(bin => `
          <h3>${bin.name} (${bin.type === 'sharp' ? 'Kesici/Delici' : bin.type === 'solid' ? 'Katı' : 'Sıvı'})</h3>
          <table>
            <thead>
              <tr>
                <th>Açıklama</th>
                <th>Aktivite</th>
                <th>Kaynak</th>
                <th>Atılma Zamanı</th>
              </tr>
            </thead>
            <tbody>
              ${bin.items.map(item => `
                <tr>
                  <td>${item.description || '-'}</td>
                  <td>${item.activity.toFixed(2)} ${item.unit}</td>
                  <td>${item.source}</td>
                  <td>${new Date(item.disposedAt).toLocaleString('tr-TR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}

        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
          <p>Nükleer Tıp Asistanı © 2025 - Otomatik Oluşturulmuş Rapor</p>
        </div>

        <button class="no-print" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
          🖨️ Yazdır
        </button>
      </body>
    </html>
  `;
}

/**
 * Open print dialog with formatted report
 */
export function printReport(
  history: DoseLogEntry[],
  wasteBins: WasteBin[],
  isotope: Isotope,
  unit: DoseUnit,
  stats: { injectedCount: number; preparedCount: number; totalInjected: number }
) {
  const reportHTML = generatePrintableReport(history, wasteBins, isotope, unit, stats);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
