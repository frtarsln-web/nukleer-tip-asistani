
import { DoseLogEntry } from '../types';

export const exportToCSV = (history: DoseLogEntry[], isotopeName: string) => {
    if (history.length === 0) {
        alert("Dışa aktarılacak veri yok.");
        return;
    }

    const headers = ["Sıra", "Hasta Adı", "Prosedür", "Doz", "Birim", "Durum", "Zaman"];
    const rows = history.map(entry => [
        entry.queueNumber,
        entry.patientName,
        entry.procedure,
        entry.amount.toFixed(2),
        entry.unit,
        entry.status,
        new Date(entry.timestamp).toLocaleTimeString()
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Gunluk_Rapor_${isotopeName}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
