import { PendingPatient } from '../types';

// CSV Parser for manual patient list upload
export const parsePatientCSV = (csvText: string): PendingPatient[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    // Parse headers
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

    // Map common header variations to standard fields
    const headerMap: Record<string, string> = {
        'hasta': 'name',
        'hasta adı': 'name',
        'hasta adi': 'name',
        'ad': 'name',
        'ad soyad': 'name',
        'isim': 'name',
        'name': 'name',

        'protokol': 'protocolNo',
        'protokol no': 'protocolNo',
        'protocol': 'protocolNo',
        'p.no': 'protocolNo',

        'prosedür': 'procedure',
        'prosedur': 'procedure',
        'işlem': 'procedure',
        'çekim': 'procedure',
        'procedure': 'procedure',
        'tetkik': 'procedure',

        'doz': 'suggestedAmount',
        'aktivite': 'suggestedAmount',
        'amount': 'suggestedAmount',
        'miktar': 'suggestedAmount',

        'kilo': 'weight',
        'ağırlık': 'weight',
        'agirlik': 'weight',
        'weight': 'weight',
        'kg': 'weight',

        'randevu saati': 'appointmentTime',
        'saat': 'appointmentTime',
        'time': 'appointmentTime',

        'randevu tarihi': 'appointmentDate',
        'tarih': 'appointmentDate',
        'date': 'appointmentDate'
    };

    // Map headers to field names
    const fieldMapping = headers.map(h => {
        for (const [key, value] of Object.entries(headerMap)) {
            if (h.includes(key)) return value;
        }
        return null;
    });

    // Parse data rows
    const patients: PendingPatient[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(delimiter).map(v => v.trim());
        const patient: Partial<PendingPatient> = {
            id: Math.random().toString(36).substr(2, 9)
        };

        values.forEach((value, index) => {
            const field = fieldMapping[index];
            if (!field || !value) return;

            switch (field) {
                case 'name':
                    patient.name = value;
                    break;
                case 'protocolNo':
                    patient.protocolNo = value;
                    break;
                case 'procedure':
                    patient.procedure = value;
                    break;
                case 'suggestedAmount':
                    const amount = parseFloat(value.replace(',', '.'));
                    if (!isNaN(amount)) patient.suggestedAmount = amount;
                    break;
                case 'weight':
                    const weight = parseFloat(value.replace(',', '.'));
                    if (!isNaN(weight)) patient.weight = weight;
                    break;
                case 'appointmentTime':
                    patient.appointmentTime = value;
                    break;
                case 'appointmentDate':
                    patient.appointmentDate = value;
                    break;
            }
        });

        // Only add if we have at least a name
        if (patient.name) {
            patients.push(patient as PendingPatient);
        }
    }

    return patients;
};

// Excel (XLSX) to CSV converter helper
export const readExcelFile = async (file: File): Promise<string> => {
    // This is a placeholder - would need xlsx library
    // For now, assume user provides CSV
    throw new Error('Excel dosyası henüz desteklenmiyor. Lütfen CSV formatında kaydedin.');
};

// Sample CSV template generator
export const generateCSVTemplate = (): string => {
    const headers = [
        'Hasta Adı',
        'Protokol No',
        'Prosedür',
        'Kilo (kg)',
        'Doz (mCi)',
        'Randevu Tarihi',
        'Randevu Saati'
    ];

    const sampleData = [
        ['Ahmet Yılmaz', 'P12345', 'PET/BT Tüm Vücut', '75', '10', '2026-01-02', '09:00'],
        ['Ayşe Demir', 'P12346', 'PET/BT Beyin', '65', '8', '2026-01-02', '10:00'],
        ['Mehmet Kaya', 'P12347', 'PET/BT Onkolojik', '80', '12', '2026-01-02', '11:00']
    ];

    const csv = [
        headers.join(','),
        ...sampleData.map(row => row.join(','))
    ].join('\n');

    return csv;
};

// Download CSV template
export const downloadCSVTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasta-listesi-sablonu.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
