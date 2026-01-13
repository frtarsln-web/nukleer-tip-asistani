// Klinik Protokoller - PET/CT Çekimleri için Kapsamlı Protokol Kütüphanesi

export type ProtocolCategory = 'oncology' | 'cardiac' | 'neurology' | 'pediatric' | 'infection';

export interface ClinicalProtocol {
    id: string;
    name: string;
    nameEn: string;
    category: ProtocolCategory;
    subcategory?: string;
    radiopharmaceutical: string;

    // Doz bilgileri
    dosePerKg: { min: number; max: number }; // MBq/kg
    maxDose?: number; // MBq
    minDose?: number; // MBq

    // Zamanlama
    uptakeTime: { min: number; max: number }; // dakika
    scanDuration?: { min: number; max: number }; // dakika

    // Hasta hazırlık
    fastingHours: number;
    hydration: string;
    dietRestrictions: string[];
    medicationNotes: string[];

    // Çekim parametreleri
    scanRange: string;
    patientPosition: string;
    armsPosition: 'up' | 'down' | 'both';
    contrast?: {
        oral: boolean;
        iv: boolean;
        notes: string;
    };

    // Özel notlar
    specialInstructions: string[];
    contraindications: string[];
    clinicalIndications: string[];

    // Görsel
    icon: string;
    color: string;
}

export const PROTOCOL_CATEGORIES: Record<ProtocolCategory, { name: string; icon: string; color: string }> = {
    oncology: { name: 'Onkoloji', icon: '🎗️', color: 'rose' },
    cardiac: { name: 'Kardiyak', icon: '❤️', color: 'red' },
    neurology: { name: 'Nöroloji', icon: '🧠', color: 'purple' },
    pediatric: { name: 'Pediatrik', icon: '👶', color: 'blue' },
    infection: { name: 'Enfeksiyon/İnflamasyon', icon: '🦠', color: 'amber' }
};

export const CLINICAL_PROTOCOLS: ClinicalProtocol[] = [
    // ==================== ONKOLOJİ ====================
    {
        id: 'lung-oncology',
        name: 'Akciğer Kanseri',
        nameEn: 'Lung Cancer',
        category: 'oncology',
        subcategory: 'Torasik Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🫁',
        color: 'sky',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 15, max: 25 },

        fastingHours: 6,
        hydration: '500-1000 ml su (enjeksiyon öncesi ve sonrası)',
        dietRestrictions: [
            'Karbonhidratsız diyet (24 saat önce)',
            'Şekerli yiyecek/içecek yasak',
            'Kafein kısıtlaması'
        ],
        medicationNotes: [
            'Kan şekeri < 150 mg/dL olmalı',
            'Diyabetik hastada insülin 4 saat önce kesilmeli',
            'Metformin çekimden 48 saat önce kesilmeli (IV kontrast kullanılacaksa)'
        ],

        scanRange: 'Kafa tabanı - Üst uyluk',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: true,
            iv: true,
            notes: 'IV kontrast rutin önerilir, oral kontrast opsiyonel'
        },

        specialInstructions: [
            'Kollar yukarıda, eller başın üzerinde',
            'Sessiz, karanlık odada bekleme',
            'Fiziksel aktivite yasak',
            'Solunum komutu için hasta eğitimi'
        ],
        contraindications: [
            'Kontrolsüz diyabet (kan şekeri > 200 mg/dL)',
            'Hamilelik',
            'Ağır böbrek yetmezliği (IV kontrast için)'
        ],
        clinicalIndications: [
            'Primer akciğer kanseri evrelemesi',
            'Tedavi yanıtı değerlendirmesi',
            'Nüks şüphesi',
            'Soliter pulmoner nodül karakterizasyonu',
            'Mediastinal lenf nodu değerlendirmesi'
        ]
    },

    {
        id: 'breast-oncology',
        name: 'Meme Kanseri',
        nameEn: 'Breast Cancer',
        category: 'oncology',
        subcategory: 'Meme Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🎀',
        color: 'pink',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 15, max: 25 },

        fastingHours: 6,
        hydration: '500-1000 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet (24 saat önce)',
            'Şekerli gıda yasak'
        ],
        medicationNotes: [
            'Kan şekeri < 150 mg/dL',
            'Kemoterapi sonrası en az 2 hafta beklemeli',
            'Radyoterapi sonrası en az 3 ay beklemeli'
        ],

        scanRange: 'Kafa tabanı - Üst uyluk',
        patientPosition: 'Supine (Prone meme görüntüleme opsiyonel)',
        armsPosition: 'up',
        contrast: {
            oral: false,
            iv: true,
            notes: 'IV kontrast lokal değerlendirmede yardımcı'
        },

        specialInstructions: [
            'Aksiller lenf nodları için kollar yukarıda',
            'Primer meme lezyonu için prone pozisyon düşünülebilir',
            'Menstrüel siklus 5-10. günler arası önerilir'
        ],
        contraindications: [
            'Hamilelik',
            'Emzirme (24 saat ara verilmeli)',
            'Kontrolsüz diyabet'
        ],
        clinicalIndications: [
            'Lokal ileri meme kanseri evrelemesi',
            'Metastatik hastalık taraması',
            'Neoadjuvan kemoterapi yanıt değerlendirmesi',
            'Nüks şüphesi',
            'İnflamatuar meme kanseri'
        ]
    },

    {
        id: 'lymphoma',
        name: 'Lenfoma',
        nameEn: 'Lymphoma',
        category: 'oncology',
        subcategory: 'Hematolojik Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🩸',
        color: 'violet',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 6,
        hydration: '500-1000 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet (24 saat önce)'
        ],
        medicationNotes: [
            'G-CSF sonrası en az 5-7 gün beklemeli (kemik iliği uptake\'i)',
            'Kemoterapi sonrası en az 2-3 hafta beklemeli'
        ],

        scanRange: 'Vertex - Uyluk',
        patientPosition: 'Supine',
        armsPosition: 'down',
        contrast: {
            oral: true,
            iv: false,
            notes: 'Oral kontrast barsak değerlendirmesi için'
        },

        specialInstructions: [
            'Kollar gövde yanında (aksilla değerlendirmesi için)',
            'Lugano kriterleri kullanılır',
            'Deauville skoru ile yanıt değerlendirmesi',
            'Baştan uyluğa tüm vücut tarama'
        ],
        contraindications: [
            'Aktif enfeksiyon (yanlış pozitif)',
            'Son 2 hafta içinde kemoterapi'
        ],
        clinicalIndications: [
            'Hodgkin lenfoma evrelemesi',
            'Non-Hodgkin lenfoma evrelemesi',
            'İnterim tedavi yanıtı (Deauville)',
            'Tedavi sonu değerlendirme',
            'Rezidü kitle değerlendirmesi'
        ]
    },

    {
        id: 'colorectal-oncology',
        name: 'Kolorektal Kanser',
        nameEn: 'Colorectal Cancer',
        category: 'oncology',
        subcategory: 'GİS Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🔴',
        color: 'orange',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 15, max: 25 },

        fastingHours: 6,
        hydration: '1000-1500 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet',
            'Lifli gıdalar kısıtlanabilir'
        ],
        medicationNotes: [
            'Kolonoskopi sonrası en az 1 hafta beklemeli',
            'Biyopsi sonrası en az 1 hafta beklemeli'
        ],

        scanRange: 'Kafa tabanı - Uyluk',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: true,
            iv: true,
            notes: 'Oral ve IV kontrast birlikte önerilir'
        },

        specialInstructions: [
            'Barsak temizliği opsiyonel',
            'Kolon distansiyonu için negatif oral kontrast kullanılabilir',
            'Karaciğer metastazları için portal venöz faz'
        ],
        contraindications: [
            'Akut barsak obstrüksiyonu',
            'Perforasyon şüphesi'
        ],
        clinicalIndications: [
            'Primer tümör evrelemesi',
            'Karaciğer metastaz taraması',
            'CEA yüksekliğinde nüks araştırması',
            'Tedavi yanıtı değerlendirmesi',
            'Cerrahi öncesi değerlendirme'
        ]
    },

    {
        id: 'head-neck-oncology',
        name: 'Baş-Boyun Kanseri',
        nameEn: 'Head and Neck Cancer',
        category: 'oncology',
        subcategory: 'Baş-Boyun Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '👤',
        color: 'teal',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 6,
        hydration: '500 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet',
            'Sakız çiğneme yasak (masseter uptake)'
        ],
        medicationNotes: [
            'Radyoterapi sonrası en az 3 ay beklemeli',
            'Biyopsi sonrası en az 2 hafta beklemeli'
        ],

        scanRange: 'Vertex - Üst uyluk',
        patientPosition: 'Supine, baş nötral pozisyonda',
        armsPosition: 'down',
        contrast: {
            oral: false,
            iv: true,
            notes: 'IV kontrast rutin önerilir'
        },

        specialInstructions: [
            'Çekim öncesi konuşmama (larinks uptake)',
            'Sakız çiğneme yasak',
            'Boyun ekstansiyonu ile çekim',
            'Dental metal artefakt kontrolü'
        ],
        contraindications: [
            'Akut tonsillitis/farenjit',
            'Son dental işlem'
        ],
        clinicalIndications: [
            'Skuamöz hücreli karsinom evrelemesi',
            'Primeri bilinmeyen boyun metastazı',
            'Tedavi sonrası nüks',
            'Radyoterapi planlaması',
            'İkinci primer tümör taraması'
        ]
    },

    {
        id: 'melanoma',
        name: 'Melanom',
        nameEn: 'Melanoma',
        category: 'oncology',
        subcategory: 'Deri Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🔵',
        color: 'slate',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 6,
        hydration: '500-1000 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet'
        ],
        medicationNotes: [
            'İmmünoterapi ile eş zamanlı çekilebilir'
        ],

        scanRange: 'Vertex - Ayak parmakları (tüm vücut)',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: false,
            iv: true,
            notes: 'IV kontrast beyin metastazları için yararlı'
        },

        specialInstructions: [
            'Tüm vücut tarama (ayaklara kadar)',
            'Beyin MRG eş zamanlı önerilir',
            'Clark ve Breslow seviyesi not edilmeli'
        ],
        contraindications: [],
        clinicalIndications: [
            'Yüksek riskli melanom evrelemesi (Breslow > 4mm)',
            'Sentinel lenf nodu pozitifliğinde',
            'Metastatik melanom takibi',
            'İmmünoterapi yanıt değerlendirmesi'
        ]
    },

    // ==================== KARDİYAK ====================
    {
        id: 'cardiac-viability',
        name: 'Miyokard Viabilite',
        nameEn: 'Myocardial Viability',
        category: 'cardiac',
        subcategory: 'Kardiyak PET',
        radiopharmaceutical: 'F-18 FDG',
        icon: '💓',
        color: 'red',

        dosePerKg: { min: 5.2, max: 7.4 },
        maxDose: 555,
        minDose: 296,

        uptakeTime: { min: 45, max: 60 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 12,
        hydration: '500 ml su',
        dietRestrictions: [
            'Düşük karbonhidrat, yüksek yağ öğünü (çekim öncesi gece)',
            'Uzun süreli açlık (12-18 saat)'
        ],
        medicationNotes: [
            'Glukoz yüklemesi protokolü uygulanacak',
            'Açlık + Glukoz yüklemesi veya',
            'Açlık + İnsülin-Glukoz clamp',
            'Diyabetiklerde insülin yönetimi kritik'
        ],

        scanRange: 'Kalp, 3D kardiyak akuizisyon',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: false,
            iv: false,
            notes: 'Kontrast gerekli değil'
        },

        specialInstructions: [
            'Glukoz yüklemesi: 50g oral glukoz',
            'Kan şekeri takibi gerekli',
            'EKG gating uygulanır',
            'Rest perfüzyon ile birlikte değerlendirilir',
            'Rb-82 veya N-13 Amonyak perfüzyon çekimi ile kombine edilebilir'
        ],
        contraindications: [
            'Kontrolsüz diyabet',
            'İleri kalp yetmezliği (monitörizasyon gerekir)'
        ],
        clinicalIndications: [
            'İskemik kardiyomiyopati - revaskülarizasyon kararı',
            'Hibernating miyokard tespiti',
            'Stunning miyokard değerlendirmesi',
            'Bypass veya stent öncesi viabilite'
        ]
    },

    {
        id: 'cardiac-sarcoidosis',
        name: 'Kardiyak Sarkoidoz',
        nameEn: 'Cardiac Sarcoidosis',
        category: 'cardiac',
        subcategory: 'Kardiyak PET',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🫀',
        color: 'rose',

        dosePerKg: { min: 5.2, max: 7.4 },
        maxDose: 555,
        minDose: 296,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 18,
        hydration: '500 ml su',
        dietRestrictions: [
            'Uzun süreli açlık (en az 18 saat)',
            'Düşük karbonhidratlı, yüksek yağlı diyet (önceki 2 öğün)',
            '50g yağ + 0g karbonhidrat (önceki öğün)'
        ],
        medicationNotes: [
            'Heparin enjeksiyonu düşünülebilir (15 IU/kg, 15 dk önce)',
            'Normal miyokard FDG uptake\'ini baskılamak kritik'
        ],

        scanRange: 'Kalp + Akciğerler (toraks)',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: false,
            iv: false,
            notes: 'Kontrast gerekli değil'
        },

        specialInstructions: [
            'Normal miyokard FDG suppressyonu sağlanmalı',
            'Perfüzyon çekimi ile kombine edilmeli',
            'Fokal uptake patolojik, diffüz uptake hazırlık yetersizliği',
            'Tedavi yanıtı takibinde kullanılır'
        ],
        contraindications: [
            'Yetersiz hasta hazırlığı'
        ],
        clinicalIndications: [
            'Kardiyak sarkoidoz tanısı',
            'Sarkoidoz tedavi yanıtı',
            'Açıklanamayan kalp bloğu',
            'Ventriküler aritmi'
        ]
    },

    // ==================== NÖROLOJİ ====================
    {
        id: 'brain-dementia',
        name: 'Demans Değerlendirmesi',
        nameEn: 'Dementia Evaluation',
        category: 'neurology',
        subcategory: 'Nörodejeneratif',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🧩',
        color: 'purple',

        dosePerKg: { min: 2.6, max: 3.7 },
        maxDose: 296,
        minDose: 185,

        uptakeTime: { min: 30, max: 45 },
        scanDuration: { min: 10, max: 20 },

        fastingHours: 4,
        hydration: 'Normal',
        dietRestrictions: [
            'Hafif açlık yeterli (4 saat)'
        ],
        medicationNotes: [
            'Sedatifler çekim bittikten sonra verilebilir',
            'Antiepileptikler kesilmemeli',
            'Benzodiazepin artefakt yaratabilir'
        ],

        scanRange: 'Beyin, 3D akuizisyon',
        patientPosition: 'Supine, baş sabitlenmiş',
        armsPosition: 'down',
        contrast: {
            oral: false,
            iv: false,
            notes: 'Kontrast gerekli değil'
        },

        specialInstructions: [
            'Sessiz, karanlık, rahat ortamda bekleme',
            'Gözler açık veya kapalı (tutarlı olmalı)',
            'Konuşmama, okumama, müzik dinlememe',
            'Uptake sırasında minimal stimülasyon',
            '3D-SSP veya NeuroQ analizi önerilir'
        ],
        contraindications: [
            'Anksiyete/klostrofobi (sedatif gerekebilir)'
        ],
        clinicalIndications: [
            'Alzheimer hastalığı şüphesi',
            'Frontotemporal demans',
            'Lewy cisimcikli demans',
            'Vasküler demans vs nörodejeneratif ayrımı',
            'Hafif bilişsel bozukluk prognozu'
        ]
    },

    {
        id: 'brain-epilepsy',
        name: 'Epilepsi Odağı',
        nameEn: 'Epilepsy Focus',
        category: 'neurology',
        subcategory: 'Epilepsi',
        radiopharmaceutical: 'F-18 FDG',
        icon: '⚡',
        color: 'yellow',

        dosePerKg: { min: 2.6, max: 3.7 },
        maxDose: 296,
        minDose: 185,

        uptakeTime: { min: 30, max: 45 },
        scanDuration: { min: 10, max: 20 },

        fastingHours: 4,
        hydration: 'Normal',
        dietRestrictions: [],
        medicationNotes: [
            'Antiepileptikler KESİLMEMELİ',
            'İnteriktal dönemde çekilmeli',
            'Son nöbetten en az 24-48 saat sonra'
        ],

        scanRange: 'Beyin, 3D akuizisyon',
        patientPosition: 'Supine, baş sabitlenmiş',
        armsPosition: 'down',
        contrast: {
            oral: false,
            iv: false,
            notes: 'Kontrast gerekli değil'
        },

        specialInstructions: [
            'İNTERİKTAL dönemde çekim yapılmalı',
            'Son nöbet zamanı kayıt edilmeli',
            'EEG korelasyonu önemli',
            'MRG ile füzyon önerilir',
            'Hipometabolik bölge = olası odak'
        ],
        contraindications: [
            'İktal dönemde enjeksiyon (sensitivite düşer)'
        ],
        clinicalIndications: [
            'Cerrahi adayı temporal lob epilepsisi',
            'MRG-negatif epilepsi',
            'Ekstratemporal epilepsi lokalizasyonu',
            'Çoklu epileptik odak şüphesi'
        ]
    },

    {
        id: 'brain-tumor',
        name: 'Beyin Tümörü',
        nameEn: 'Brain Tumor',
        category: 'neurology',
        subcategory: 'Nöroonkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🔬',
        color: 'indigo',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 370,
        minDose: 185,

        uptakeTime: { min: 45, max: 60 },
        scanDuration: { min: 10, max: 20 },

        fastingHours: 6,
        hydration: 'Normal',
        dietRestrictions: [
            'Karbonhidratsız diyet'
        ],
        medicationNotes: [
            'Kortikosteroidler kesilmemeli',
            'Kemoterapi sonrası 2 hafta beklemeli'
        ],

        scanRange: 'Beyin (+/- tüm vücut)',
        patientPosition: 'Supine',
        armsPosition: 'down',
        contrast: {
            oral: false,
            iv: false,
            notes: 'MRG ile korelasyon gerekli'
        },

        specialInstructions: [
            'MRG füzyonu zorunlu',
            'Yüksek grade tümörler FDG-avid',
            'Düşük grade tümörler FDG-negatif olabilir',
            'Aminoasit PET daha sensitif olabilir (C-11 metiyonin)'
        ],
        contraindications: [],
        clinicalIndications: [
            'Rezidü vs radyonekroz ayrımı',
            'Tümör gradlaması',
            'Biyopsi hedefleme',
            'Tedavi yanıtı değerlendirmesi',
            'Nüks şüphesi'
        ]
    },

    // ==================== PEDİATRİK ====================
    {
        id: 'pediatric-oncology',
        name: 'Pediatrik Onkoloji',
        nameEn: 'Pediatric Oncology',
        category: 'pediatric',
        subcategory: 'Çocuk Onkoloji',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🧸',
        color: 'cyan',

        dosePerKg: { min: 3.0, max: 5.2 },
        maxDose: 370,
        minDose: 26, // minimum 26 MBq

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 15, max: 25 },

        fastingHours: 4, // Daha kısa (yaşa göre)
        hydration: 'Yaşa uygun',
        dietRestrictions: [
            'Bebeklerde (0-1 yaş): 4 saat açlık',
            'Küçük çocuk (1-6 yaş): 4-6 saat açlık',
            'Büyük çocuk (>6 yaş): 6 saat açlık'
        ],
        medicationNotes: [
            'Sedasyon gerekebilir (anestezi konsültasyonu)',
            'Oral kloral hidrat veya IV midazolam',
            'Sedasyon uptake döneminden sonra uygulanmalı'
        ],

        scanRange: 'Vertex - Uyluk (veya tüm vücut)',
        patientPosition: 'Supine, immobilizasyon',
        armsPosition: 'down',
        contrast: {
            oral: false,
            iv: false,
            notes: 'Genellikle kontrastsız'
        },

        specialInstructions: [
            'EANM pediatrik doz hesaplayıcı kullanılmalı',
            'Minimum aktivite: 26 MBq (14 MBq 3D PET için)',
            'Aile ile birlikte bekleme mümkün',
            'Çocuk dostu ortam sağlanmalı',
            'Sedasyon gerekirse uptake sonrası',
            'Doz = Bazal doz × (ağırlık faktörü)'
        ],
        contraindications: [
            'Yetersiz sedasyon planlaması'
        ],
        clinicalIndications: [
            'Lenfoma evreleme ve takip',
            'Nöroblastom (MIBG-negatif)',
            'Yumuşak doku sarkomları',
            'Langerhans hücreli histiyositoz',
            'Wilms tümörü'
        ]
    },

    // ==================== ENFEKSİYON / İNFLAMASYON ====================
    {
        id: 'infection-fuo',
        name: 'Nedeni Bilinmeyen Ateş (FUO)',
        nameEn: 'Fever of Unknown Origin',
        category: 'infection',
        subcategory: 'Enfeksiyon',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🌡️',
        color: 'amber',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 90 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 6,
        hydration: '1000 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet'
        ],
        medicationNotes: [
            'Antibiyotikler kesilmemeli',
            'Steroidler yanlış negatife neden olabilir'
        ],

        scanRange: 'Vertex - Uyluk (tüm vücut)',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: true,
            iv: true,
            notes: 'BT tanı amaçlı kontrastlı olabilir'
        },

        specialInstructions: [
            'Tüm vücut tarama önerilir',
            'Vaskülit şüphesinde büyük damarlar değerlendirilir',
            'Kemik tutulumu için gecikmiş görüntüleme düşünülebilir',
            'Klinik bilgi kritik öneme sahip'
        ],
        contraindications: [
            'Yakın zamanda steroid kullanımı (göreceli)'
        ],
        clinicalIndications: [
            '3 haftadan uzun süren ateş',
            'Standart tetkiklerle tanı konamamış',
            'Gizli enfeksiyon/apse arama',
            'Vaskülit şüphesi',
            'Endokardit şüphesi'
        ]
    },

    {
        id: 'infection-vasculitis',
        name: 'Büyük Damar Vasküliti',
        nameEn: 'Large Vessel Vasculitis',
        category: 'infection',
        subcategory: 'Vaskülit',
        radiopharmaceutical: 'F-18 FDG',
        icon: '🩻',
        color: 'red',

        dosePerKg: { min: 3.7, max: 5.2 },
        maxDose: 400,
        minDose: 185,

        uptakeTime: { min: 60, max: 120 },
        scanDuration: { min: 20, max: 30 },

        fastingHours: 6,
        hydration: '1000 ml su',
        dietRestrictions: [
            'Karbonhidratsız diyet'
        ],
        medicationNotes: [
            'Steroid başlamadan önce çekilmeli',
            'Aktif hastalıkta steroidler kesilmemeli'
        ],

        scanRange: 'Kafa tabanı - Uyluk',
        patientPosition: 'Supine',
        armsPosition: 'up',
        contrast: {
            oral: false,
            iv: true,
            notes: 'Vasküler yapıların değerlendirmesi için IV kontrast'
        },

        specialInstructions: [
            'Aorta ve dalları dikkatle değerlendirilir',
            'Temporal arter tutulumu için kranyal alan dahil',
            'Gecikmiş görüntüleme (90-120 dk) damar duvarını iyileştirir',
            'Semi-kantitatif skorlama (karaciğer referans)'
        ],
        contraindications: [],
        clinicalIndications: [
            'Dev hücreli arterit (temporal arterit)',
            'Takayasu arteriti',
            'Aortit',
            'Vaskülit tedavi yanıtı',
            'PMR ile birliktelik şüphesi'
        ]
    }
];

// Doz hesaplama yardımcı fonksiyonları
export const calculateDose = (weightKg: number, protocol: ClinicalProtocol): { min: number; max: number; recommended: number } => {
    let minDose = weightKg * protocol.dosePerKg.min;
    let maxDose = weightKg * protocol.dosePerKg.max;

    // Min/max sınırları uygula
    if (protocol.minDose) minDose = Math.max(minDose, protocol.minDose);
    if (protocol.maxDose) {
        minDose = Math.min(minDose, protocol.maxDose);
        maxDose = Math.min(maxDose, protocol.maxDose);
    }

    const recommended = (minDose + maxDose) / 2;

    return { min: Math.round(minDose), max: Math.round(maxDose), recommended: Math.round(recommended) };
};

// EANM pediatrik doz faktörleri
export const EANM_PEDIATRIC_FACTORS: Record<number, number> = {
    3: 1, 4: 1.14, 5: 1.19, 6: 1.23, 7: 1.27, 8: 1.32,
    9: 1.36, 10: 1.40, 11: 1.44, 12: 1.48, 13: 1.52,
    14: 1.56, 15: 1.60, 16: 1.64, 17: 1.68, 18: 1.72,
    19: 1.76, 20: 1.80, 22: 1.88, 24: 1.96, 26: 2.04,
    28: 2.12, 30: 2.20, 32: 2.28, 34: 2.36, 36: 2.44,
    38: 2.52, 40: 2.60, 42: 2.68, 44: 2.76, 46: 2.84,
    48: 2.92, 50: 3.00, 52: 3.08, 54: 3.16, 56: 3.24,
    58: 3.32, 60: 3.40, 62: 3.48, 64: 3.56, 66: 3.64, 68: 3.72
};

export const calculatePediatricDose = (weightKg: number, baseDose: number = 25.9): number => {
    // En yakın weight key'i bul
    const weights = Object.keys(EANM_PEDIATRIC_FACTORS).map(Number).sort((a, b) => a - b);
    let closestWeight = weights[0];

    for (const w of weights) {
        if (Math.abs(w - weightKg) < Math.abs(closestWeight - weightKg)) {
            closestWeight = w;
        }
    }

    const factor = EANM_PEDIATRIC_FACTORS[closestWeight] || 1;
    return Math.round(baseDose * factor);
};
