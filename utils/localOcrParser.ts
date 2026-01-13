import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup - use unpkg CDN for the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;


export interface ExtractedPatient {
    id: string;
    name: string;
    protocolNo?: string;
    procedure?: string;
    suggestedAmount?: number;
    weight?: number;
    appointmentDate?: string;
    appointmentTime?: string;
}

/**
 * Extract text from PDF file using PDF.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }

    return fullText;
}

/**
 * Extract text from image file using Tesseract.js OCR
 */
export async function extractTextFromImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const imageUrl = URL.createObjectURL(file);

    try {
        const result = await Tesseract.recognize(imageUrl, 'tur+eng', {
            logger: (m) => {
                if (m.status === 'recognizing text' && onProgress) {
                    onProgress(Math.round(m.progress * 100));
                }
            }
        });

        return result.data.text;
    } finally {
        URL.revokeObjectURL(imageUrl);
    }
}

/**
 * Parse extracted text to find patient information
 * This uses multiple strategies to extract patient data from various formats
 */
export function parsePatientText(text: string): ExtractedPatient[] {
    const patients: ExtractedPatient[] = [];

    // Clean up the text
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\t+/g, ' | ')  // Convert tabs to separator
        .replace(/\s{3,}/g, ' | '); // Convert multiple spaces to separator

    const lines = cleanedText.split('\n').filter(line => line.trim().length > 3);

    // Common patterns
    const timePattern = /(\d{1,2}[:.]\d{2})/;
    const protocolPattern = /(\d{6,10})/;
    const weightPattern = /(\d{2,3})\s*kg/i;
    const dosePattern = /(\d+(?:[.,]\d+)?)\s*(?:mCi|MBq|GBq)/i;

    // Procedure keywords
    const procedureKeywords = [
        'PET', 'BT', 'CT', 'FDG', 'PSMA', 'Kemik', 'Tiroid', 'Sintigrafi',
        'MIBI', 'Kalp', 'Akciğer', 'Böbrek', 'DMSA', 'MAG3', 'DOTATATE',
        'Galyum', 'Lutesyum', 'Tedavi', 'Tüm Vücut', 'Ga-68', 'Lu-177', 'I-131',
        'SPECT', 'MPI', 'Paratiroid', 'Sentinel', 'Lenf', 'Onkoloji', 'Görüntüleme'
    ];

    // Very flexible Turkish name patterns
    const turkishChars = 'A-ZÇĞİÖŞÜa-zçğıöşü';
    const namePatterns = [
        // Standard: "Ad Soyad" or "AD SOYAD" - 2-4 words
        new RegExp(`([${turkishChars}]{2,}(?:\\s+[${turkishChars}]{2,}){1,3})`, 'g'),
    ];

    // Words to definitely skip
    const skipWords = new Set([
        'tarih', 'saat', 'hasta', 'protokol', 'isim', 'soyad', 'prosedür',
        'tetkik', 'randevu', 'numara', 'bölüm', 'klinik', 'doktor', 'servis',
        'sayfa', 'page', 'list', 'rapor', 'günlük', 'haftalık', 'toplam',
        'adet', 'birim', 'tıp', 'nükleer', 'merkez', 'hastane', 'hastanesi',
        'üniversite', 'fakülte', 'bölümü', 'birimi', 'polikliniği'
    ]);

    // Track added names to prevent duplicates
    const addedNames = new Set<string>();

    // Strategy 1: Look for lines with separator patterns (tables)
    for (const line of lines) {
        const parts = line.split(/[|,;]/).map(p => p.trim()).filter(p => p.length > 2);

        for (const part of parts) {
            // Check if this part looks like a name (2-4 words, mostly letters)
            const words = part.split(/\s+/).filter(w => w.length >= 2);

            if (words.length >= 2 && words.length <= 4) {
                // Check if words are mostly letters (not numbers or special chars)
                const isNameLike = words.every(word => {
                    const letterRatio = (word.match(new RegExp(`[${turkishChars}]`, 'g')) || []).length / word.length;
                    return letterRatio > 0.8;
                });

                if (isNameLike) {
                    const rawName = words.join(' ');
                    const lowerName = rawName.toLowerCase();

                    // Skip if contains skip words
                    if ([...skipWords].some(sw => lowerName.includes(sw))) continue;

                    // Skip if it's a procedure name
                    if (procedureKeywords.some(pk => lowerName === pk.toLowerCase())) continue;

                    // Format as title case
                    const formattedName = words
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');

                    if (addedNames.has(formattedName.toLowerCase())) continue;
                    addedNames.add(formattedName.toLowerCase());

                    // Find additional info from the full line
                    const timeMatch = line.match(timePattern);
                    const protocolMatch = line.match(protocolPattern);
                    const weightMatch = line.match(weightPattern);
                    const doseMatch = line.match(dosePattern);

                    // Find procedure
                    let procedure = '';
                    for (const kw of procedureKeywords) {
                        if (line.toLowerCase().includes(kw.toLowerCase())) {
                            procedure = kw;
                            break;
                        }
                    }

                    const patient: ExtractedPatient = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: formattedName,
                    };

                    if (protocolMatch) patient.protocolNo = protocolMatch[1];
                    if (procedure) patient.procedure = procedure;
                    if (weightMatch) patient.weight = parseInt(weightMatch[1]);
                    if (doseMatch) patient.suggestedAmount = parseFloat(doseMatch[1].replace(',', '.'));
                    if (timeMatch) patient.appointmentTime = timeMatch[1].replace('.', ':');

                    patients.push(patient);
                }
            }
        }
    }

    // Strategy 2: If no patients found with separators, try regex on each line
    if (patients.length === 0) {
        for (const line of lines) {
            for (const pattern of namePatterns) {
                const matches = line.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const words = match.trim().split(/\s+/).filter(w => w.length >= 2);
                        if (words.length >= 2 && words.length <= 4) {
                            const lowerMatch = match.toLowerCase();

                            // Skip if contains header words
                            if ([...skipWords].some(sw => lowerMatch.includes(sw))) continue;

                            // Skip procedure keywords
                            if (procedureKeywords.some(pk => lowerMatch === pk.toLowerCase())) continue;

                            const formattedName = words
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                                .join(' ');

                            if (addedNames.has(formattedName.toLowerCase())) continue;
                            addedNames.add(formattedName.toLowerCase());

                            const patient: ExtractedPatient = {
                                id: Math.random().toString(36).substr(2, 9),
                                name: formattedName,
                            };

                            // Try to extract additional info
                            const timeMatch = line.match(timePattern);
                            const protocolMatch = line.match(protocolPattern);
                            if (protocolMatch) patient.protocolNo = protocolMatch[1];
                            if (timeMatch) patient.appointmentTime = timeMatch[1].replace('.', ':');

                            patients.push(patient);
                        }
                    }
                }
            }
        }
    }

    // Log extracted text for debugging if no patients found
    if (patients.length === 0) {
        console.log('=== OCR Text Debug ===');
        console.log('Raw text length:', text.length);
        console.log('Lines found:', lines.length);
        console.log('First 5 lines:', lines.slice(0, 5));
        console.log('======================');
    }

    return patients;
}

export async function processPatientFile(
    file: File,
    onProgress?: (status: string, progress?: number) => void
): Promise<ExtractedPatient[]> {
    let text = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onProgress?.('PDF okunuyor...');
        text = await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
        onProgress?.('Görüntü analiz ediliyor (OCR)...', 0);
        text = await extractTextFromImage(file, (progress) => {
            onProgress?.(`OCR işlemi: %${progress}`, progress);
        });
    } else {
        throw new Error('Desteklenmeyen dosya formatı. PDF veya resim dosyası yükleyin.');
    }

    onProgress?.('Hasta bilgileri çıkarılıyor...');
    const patients = parsePatientText(text);

    if (patients.length === 0) {
        // Return the raw text for debugging
        console.log('Extracted text (no patients found):', text);
        throw new Error(
            'Hasta bilgisi bulunamadı. Dosya formatını kontrol edin.\n\n' +
            'Beklenen format:\n' +
            '- Hasta adı soyadı\n' +
            '- Protokol numarası (opsiyonel)\n' +
            '- İşlem türü (opsiyonel)\n' +
            '- Randevu saati (opsiyonel)'
        );
    }

    return patients;
}
