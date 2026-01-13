
import { Isotope, ColdKit } from './types';

export const ISOTOPES: Isotope[] = [
  {
    id: 'f18',
    name: 'Flor-18 (FDG)',
    symbol: '¹⁸F',
    halfLifeHours: 1.8295, // 109.77 dk
    description: 'PET/BT görüntülemede glikoz metabolizmasını değerlendirmek için kullanılır.',
    color: 'bg-orange-600',
    commonProcedures: [
      'PET/BT Tüm Vücut (Onkolojik)',
      'PET/BT Beyin (Metabolik)',
      'PET/BT Miyokard Viabilite',
      'F-18 NaF PET/BT (Kemik)',
      'F-18 PSMA PET/BT (Prostat)'
    ],
    imagingProtocols: {
      'PET/BT Tüm Vücut (Onkolojik)': `📋 HAZIRLIK: Hasta en az 6 saat aç olmalı. Kan şekeri <200 mg/dL kontrol edilmeli. Diyabet hastalarında insülin protokolü uygulanır.

⏱️ BEKLEME: Enjeksiyon sonrası 60 dk sessiz, loş ve sıcak odada istirahat. Hasta konuşmamalı, telefon kullanmamalı.

🚻 ÇEKİM ÖNCESİ: Hastayı tuvalete gönderin. Mesanenin boş olması önemli!

📸 ÇEKİM: • Pozisyon: Supin, kollar yukarıda (oral-nasal pozisyon)
• FOV: Verteks → Uyluk ortası (tüm vücut)
• Süre: Yatak başına 1.5-3 dk (toplam 15-20 dk)
• BT Protokol: Düşük doz (50-80 mAs) veya tanısal (kontrast ile)

⚠️ DİKKAT: Metal protez bölgelerinde atenuasyon artefaktı olabilir. Kemoterapi sonrası en az 2 hafta beklenmeli.`,

      'PET/BT Beyin (Metabolik)': `📋 HAZIRLIK: 4-6 saat açlık. Sedatif ilaçlar kesilmeli. Kafein kullanımı yasak.

💉 ENJEKSİYON: Sessiz, loş ve rahat bir odada yapılmalı. Gözler açık/kapalı protokolüne uyulmalı (klinik endikasyona göre).

⏱️ BEKLEME: 30-45 dk dinlenme. Hasta konuşmamalı, okumamı, telefon kullanmamalı.

📸 ÇEKİM: • Pozisyon: Supin, baş sabitleyici ile fikse
• FOV: Sadece beyin (kafatası tabanı → verteks)
• Süre: 10-15 dk statik çekim
• Matriks: 256x256 (yüksek çözünürlük)

⚠️ DİKKAT: Epilepsi değerlendirmesinde interiktal/iktal zamanlama kritik. Demans için FDG uptake paterni değerlendirilir.`,

      'PET/BT Miyokard Viabilite': `📋 HAZIRLIK: Glikoz yükleme protokolü: 50g oral glikoz + insülin clamp. Kan şekeri 100-140 mg/dL arasında tutulmalı.

💉 ENJEKSİYON: Glikoz-insülin dengesinden sonra FDG enjeksiyonu.

⏱️ BEKLEME: 60-90 dk (miyokard tutulumu için uzun bekleme).

📸 ÇEKİM: • Pozisyon: Supin, kollar yukarıda
• FOV: Kalp odaklı (apikal → bazal)
• ECG-Gating: Gated çekim önerilir
• Rekonstrüksiyon: Kardiyak yazılım ile kısa/uzun eksen

⚠️ DİKKAT: Diyabet hastalarında glikoz-insülin clamp dikkatle uygulanmalı. Miyokard perfüzyon SPECT ile birlikte değerlendirilir.`,

      'F-18 NaF PET/BT (Kemik)': `📋 HAZIRLIK: Özel açlık gerekmez. Enjeksiyon öncesi iyi hidrasyon önerilir.

⏱️ BEKLEME: 45-60 dk.

📸 ÇEKİM: • Pozisyon: Supin, kollar yanda veya yukarıda
• FOV: Verteks → Ayak (tüm iskelet)
• Süre: Yatak başına 2-3 dk
• BT: Düşük doz veya tanısal

🎯 AVANTAJ: Tc-99m MDP'ye göre çok daha yüksek spatial çözünürlük. Erken kemik metastazları için sensitif.`,

      'F-18 PSMA PET/BT (Prostat)': `📋 HAZIRLIK: Özel hazırlık gerekmez. Hidrasyon önerilir.

⏱️ BEKLEME: 60 dk.

📸 ÇEKİM: • Pozisyon: Supin, kollar yukarıda
• FOV: Verteks → Uyluk ortası (pelvik odak ile)
• Erken pelvik görüntü: 45-60 dk (idrar yolu aktivitesi öncesi)
• Geç görüntü: Gerekirse 2-3. saatte

⚠️ DİKKAT: Mesane aktivitesi pelvik lezyonları maskeleyebilir. Foley kateter düşünülebilir.`
    }
  },
  {
    id: 'tc99m',
    name: 'Teknesyum-99m',
    symbol: '⁹⁹ᵐTc',
    halfLifeHours: 6.0067,
    description: 'Tanısal görüntülemede en yaygın kullanılan tıbbi radyoizotop.',
    color: 'bg-blue-500',
    commonProcedures: [
      'Kemik Sintigrafisi (Tüm Vücut)',
      'Kemik Sintigrafisi (3 Fazlı)',
      'Miyokard Perfüzyon (Sestamibi-Stres)',
      'Miyokard Perfüzyon (Sestamibi-İstirahat)',
      'Tiroid Sintigrafisi',
      'Paratiroid Sintigrafisi',
      'Böbrek Sintigrafisi (DTPA)',
      'Böbrek Sintigrafisi (MAG3)',
      'Böbrek Sintigrafisi (DMSA)',
      'Akciğer Perfüzyon Sintigrafisi',
      'Hepatobiliyer Sintigrafi (HIDA)',
      'Sentinel Lenf Nodu Lokalizasyonu',
      'Dakriyosintigrafi',
      'Mide Boşalım Zamanı'
    ],
    imagingProtocols: {
      'Kemik Sintigrafisi (Tüm Vücut)': `📋 HAZIRLIK: Özel açlık gerekmez. Bol sıvı alımı (hidrasyon) önerilir.

⏱️ BEKLEME: Enjeksiyon sonrası 2-4 saat. Bu sürede sık sık idrar çıkışı yaptırın.

🚻 ÇEKİM ÖNCESİ: Mesane mutlaka boşaltılmalı (mesane aktivitesi pelvis değerlendirmesini engeller).

📸 ÇEKİM: • Pozisyon: Supin, kollar yanda
• Kolimatör: LEHR (Düşük enerji yüksek çözünürlük)
• Tüm vücut tarama: Anterior + Posterior (hız: 10-15 cm/dk)
• Gerekirse spot görüntüler (özellikle lezyon şüphesi bölgelerde)

⚠️ DİKKAT: Böbrek yetmezliğinde gecikmiş çekim gerekebilir. Son 1-2 günde baryum verilmişse bekleyin.`,

      'Kemik Sintigrafisi (3 Fazlı)': `📋 ENDİKASYON: Osteomiyelit, kompleks bölge ağrı sendromu, gevşeme, protez enfeksiyonu.

📸 1. FAZ (KAN AKIMI): • Enjeksiyonla eş zamanlı dinamik çekim
• Her 2-3 sn bir frame, toplam 60 sn
• İlgi bölgesi merkezlenmeli

📸 2. FAZ (KAN HAVUZU): • Enjeksiyondan 5-10 dk sonra
• Statik görüntü (500K sayım)
• Yumuşak doku değerlendirmesi

📸 3. FAZ (GECİKMİŞ): • 2-4 saat sonra
• Tüm vücut veya spot görüntüler
• Kemik tutulumu değerlendirmesi

🎯 YORUM: Tüm 3 fazda artış = Osteomiyelit. Sadece 3. fazda artış = Dejeneratif/metabolik.`,

      'Miyokard Perfüzyon (Sestamibi-Stres)': `📋 HAZIRLIK: • Beta-bloker: 48 saat önce kes
• Kafein, teofilin: 24 saat önce kes
• 4 saat açlık

💪 STRES PROTOKOLü: • Efor testi (Bruce): Max kalp hızının %85'ine ulaşılmalı
• Farmakolojik (Adenozin/Regadenoson): Adenozin 6 dk infüzyon
• Stres pik anında enjeksiyon

⏱️ BEKLEME: 30-60 dk (yağlı yemek yedirilir → karaciğer temizliği için)

📸 ÇEKİM: • Pozisyon: Supin, sol kol yukarıda
• Kolimatör: LEHR
• Gated SPECT: 8-16 frame/siklus
• Matriks: 64x64, 180° veya 360°

⚠️ DİKKAT: Astımlı hastalarda adenozin kontrendike. Regadenoson alternatif.`,

      'Tiroid Sintigrafisi': `📋 HAZIRLIK: • İyotlu gıda kısıtlaması: 1-2 hafta (yosun, deniz ürünleri, iyotlu tuz)
• İyotlu ilaçlar: Amiodaron (1-6 ay), kontrast (4-6 hafta) bekle
• Levotiroksin: 4 hafta önce kes (gerekirse)

⏱️ BEKLEME: Enjeksiyon sonrası 15-20 dk.

📸 ÇEKİM: • Pozisyon: Supin, boyun hafif ekstansiyonda
• Kolimatör: Pinhole (yüksek çözünürlük) veya LEHR
• Markerlar: Sternal notch, çene
• Anterior görüntü: 100-200K sayım

🎯 DEĞERLENDİRME: Sıcak nodül = Fonksiyone (genelde benign). Soğuk nodül = ITMAB önerilir.`,

      'Böbrek Sintigrafisi (DTPA)': `📋 HAZIRLIK: İyi oral hidrasyon (enjeksiyondan 30 dk önce 500 mL su).

📸 ÇEKİM: • Pozisyon: Supin (posterior görüntüleme)
• 60-90 sn/frame, toplam 20-30 dk dinamik çekim
• İlk 2 dk: Perfüzyon fazı
• 2-20 dk: Kortikal faz

💉 DİÜRETİK (Lasix): • Doz: 0.5 mg/kg IV (çekim ortasında veya 15-20 dk'da)
• Tıkanıklık şüphesinde uygulanır
• Post-diüretik 15-20 dk daha çekim

📊 SONUÇ: GFR hesabı, relatif fonksiyon (%), drenaj paterni.`,

      'Böbrek Sintigrafisi (DMSA)': `📋 HAZIRLIK: Özel hazırlık gerekmez. Çocuklarda sedasyon gerekebilir.

⏱️ BEKLEME: Enjeksiyon sonrası 2-4 saat (kortikal tutulum için).

📸 ÇEKİM: • Pozisyon: Prone (arkadan) veya supin
• Posterior, sağ ve sol posterior oblik görüntüler
• Pinhole kolimatör önerilir (özellikle çocuklarda)
• Her görüntü: 200-500K sayım

📊 SONUÇ: Relatif böbrek fonksiyonu (%), kortikal skar değerlendirmesi.`,

      'Hepatobiliyer Sintigrafi (HIDA)': `📋 HAZIRLIK: • Minimum 4 saat (ideal 6 saat) açlık
• >24 saat açlık: Sincalide (CCK) ön hazırlığı
• Bilirubin >10 mg/dL ise tanısal değeri düşer

📸 ÇEKİM: • Pozisyon: Supin, anterior görüntüleme
• 1 frame/dk, 60 dk dinamik çekim
• Karaciğer → Safra yolları → Safra kesesi → Bağırsak akışı izlenir

❌ SAFRA KESESİ GÖRÜLMEZSE: • Geç görüntüler (2-4 saat)
• Morfin enjeksiyonu: 0.04 mg/kg IV → 30 dk sonra çekim
• Sincalide: Ejeksiyon fraksiyonu hesabı için

📊 SONUÇ: Akut/kronik kolesistit, safra yolu tıkanıklığı, postop kaçak.`,

      'Sentinel Lenf Nodu Lokalizasyonu': `📋 ENDİKASYON: Meme kanseri, melanom, vulva kanseri, diğer tümörler.

💉 ENJEKSİYON: • Lezyon çevresine intrakutan/subkutan (4-6 noktadan)
• Meme: Periareolar veya peritümöral
• Melanom: Lezyon etrafına intradermal

⏱️ BEKLEME: 15-30 dk (lenfatik drenaj için).

📸 ÇEKİM: • Dinamik: İlk 20 dk (lenfatik yollar)
• Statik: Anterior, lateral görüntüler
• Cilt işaretleme: SLN pozisyonu işaretlenir

🔊 GAMA PROB: • Ameliyatta intraoperatif kullanım
• Arka plan/SLN oranı >3:1 olmalı`
    },
    hasGenerator: true,
    parentIsotope: {
      symbol: '⁹⁹Mo',
      halfLifeHours: 66.02
    }
  },
  {
    id: 'ga68',
    name: 'Galyum-68',
    symbol: '⁶⁸Ga',
    halfLifeHours: 1.1285, // 67.7 dk
    description: 'Prostat ve nöroendokrin tümörlerin PET görüntülemesinde kullanılır.',
    color: 'bg-rose-500',
    commonProcedures: [
      'Ga-68 PSMA PET/BT (Prostat)',
      'Ga-68 DOTATATE PET/BT (Nöroendokrin)',
      'Ga-68 FAPI PET/BT'
    ],
    imagingProtocols: {
      'Ga-68 PSMA PET/BT (Prostat)': 'Özel açlık gerekmez. Hidrasyon ve oral kontrast önerilebilir. Enjeksiyon sonrası 60 dk bekleme.',
      'Ga-68 DOTATATE PET/BT (Nöroendokrin)': 'Somatostatin analogları (kısa etkili 24 saat, uzun etkili 4 hafta) kesilmeli. 45-60 dk bekleme sonrası çekim.',
      'Ga-68 FAPI PET/BT': 'Hızlı tümör tutulumu. Enjeksiyon sonrası 10-60 dk içinde çekim yapılabilir. Açlık gerekmez.'
    }
  },
  {
    id: 'i131',
    name: 'İyot-131',
    symbol: '¹³¹I',
    halfLifeHours: 192.48, // ~8.02 gün
    description: 'Tiroid görüntülemesi ve hipertiroidizm/tiroid kanseri tedavisinde kullanılır.',
    color: 'bg-purple-500',
    commonProcedures: [
      'Tiroid Uptake Testi',
      'Tüm Vücut Tarama (Tanısal)',
      'Tüm Vücut Tarama (Post-Tedavi)',
      'Hipertiroidi Tedavisi',
      'Tiroid Kanser Tedavisi (Ablasyon)'
    ],
    imagingProtocols: {
      'Tiroid Uptake Testi': '45 dk-1 saat ve 24 saatlik ölçümler. İyot kısıtlaması şart.',
      'Tüm Vücut Tarama (Tanısal)': 'Düşük doz (2-5 mCi) I-131 oral alımı sonrası 48-72. saatte görüntüleme. TSH >30 mIU/L olmalı.',
      'Tüm Vücut Tarama (Post-Tedavi)': 'Yüksek doz tedavi sonrası 5-7. günlerde tüm vücut tarama yapılır.',
      'Hipertiroidi Tedavisi': 'Hesaplanan dozun oral uygulanması. 1 hafta iyot kısıtlaması ve radyasyon güvenliği kuralları eğitimi.'
    }
  },
  {
    id: 'lu177',
    name: 'Lutesyum-177',
    symbol: '¹⁷⁷Lu',
    halfLifeHours: 159.528, // ~6.647 gün
    description: 'Nöroendokrin tümörlerin hedeflenmiş radyonüklid tedavisinde kullanılır.',
    color: 'bg-emerald-500',
    commonProcedures: [
      'Lu-177 PSMA Tedavisi',
      'Lu-177 DOTATATE Tedavisi'
    ],
    imagingProtocols: {
      'Lu-177 PSMA Tedavisi': 'İntravenöz infüzyon. Tedavi sonrası 24, 48 ve 72. saatlerde dozimetrik SPECT/BT çekimleri gerekebilir.',
      'Lu-177 DOTATATE Tedavisi': 'Aminosat infüzyonu ile böbrek koruma. Tedavi sonrası 24-48. saatlerde post-tedavi tüm vücut tarama.'
    }
  }
];

export const COLD_KITS: ColdKit[] = [
  {
    id: 'mdp',
    name: 'MDP',
    fullName: 'Metilen Difosfonat',
    description: 'Kemik Sintigrafisi için kullanılır.',
    preparationSteps: [
      'Flakonu kurşun zırha yerleştirin.',
      '1-8 mL (maks. 500 mCi) Tc-99m perteknetat ekleyin.',
      'İçerik çözünene kadar hafifçe çalkalayın.',
      'Oda sıcaklığında 15-20 dk inkübe edin.',
      '6 saat içinde tüketin, 15-30°C\'de saklayın.'
    ],
    prepTimerMinutes: 15
  },
  {
    id: 'mibi',
    name: 'MIBI',
    fullName: 'Sestamibi',
    description: 'Miyokard Perfüzyon Sintigrafisi için kullanılır.',
    preparationSteps: [
      '1-3 mL (25-150 mCi) Tc-99m ekleyin.',
      'Basıncı dengelemek için eşit hacimde hava çekin.',
      'Vigo şekilde çalkalayın (5-10 kez).',
      'Kaynar su banyosu (boiling water bath) içinde 10 dk bekletin.',
      'Sudan çıkarıp 15 dk soğumaya bırakın.',
      '12 saat içinde tüketin, <25°C\'de saklayın.'
    ],
    prepTimerMinutes: 10
  },
  {
    id: 'dtpa',
    name: 'DTPA',
    fullName: 'Dietilen Triamin Pentaasetat',
    description: 'Böbrek (Dinamik) Sintigrafisi için kullanılır.',
    preparationSteps: [
      '2-10 mL (maks. 160-500 mCi) Tc-99m ekleyin.',
      '1 dk boyunca çalkalayın ve 1-2 dk bekletin.',
      'GFR için 1 saat, görüntüleme için 6 saat içinde tüketin.'
    ],
    prepTimerMinutes: 2
  },
  {
    id: 'mag3',
    name: 'MAG3',
    fullName: 'Merosid',
    description: 'Böbrek (Dinamik) Sintigrafisi için kullanılır.',
    preparationSteps: [
      'Filtreli hava iğnesini takın.',
      '4-10 mL (20-100 mCi) Tc-99m ekleyin.',
      'Hemen ardından 2 mL filtreli hava enjekte edin (oksidasyon için).',
      'Kaynar su banyosunda 10 dk inkübe edin.',
      '15 dk soğutun ve 6 saat içinde tüketin.'
    ],
    prepTimerMinutes: 10
  },
  {
    id: 'dmsa',
    name: 'DMSA',
    fullName: 'Süksimer',
    description: 'Böbrek (Statik) Sintigrafisi için kullanılır.',
    preparationSteps: [
      '1-6 mL (maks. 40 mCi) Tc-99m ekleyin.',
      'Basıncı dengeleyin, 10-60 sn hafifçe karıştırın.',
      'Oda sıcaklığında 10-15 dk bekletin.',
      '4 saat içinde tüketin, ışıktan koruyun.'
    ],
    prepTimerMinutes: 15
  },
  {
    id: 'maa',
    name: 'MAA',
    fullName: 'Makroagrege Albümin',
    description: 'Akciğer Perfüzyon Sintigrafisi için kullanılır.',
    preparationSteps: [
      '2-13 mL Tc-99m ekleyin (Basınç dengelemeyin/vent yapmayın).',
      'Karıştırın ve 15 dk oda sıcaklığında bekletin.',
      'Uygulama öncesi partikülleri resüspanse etmek için hafifçe çalkalayın.',
      '8 saat içinde tüketin, 2-8°C\'de (buzdolabı) saklayın.'
    ],
    prepTimerMinutes: 15
  },
  {
    id: 'hida',
    name: 'HIDA',
    fullName: 'Brizifenin',
    description: 'Kolesintigrafi (HIDA) için kullanılır.',
    preparationSteps: [
      '2-5 mL Tc-99m ekleyin.',
      'Tam çözünene kadar çalkalayın.',
      'Oda sıcaklığında 15 dk bekletin.',
      '6 saat içinde tüketin.'
    ],
    prepTimerMinutes: 15
  },
  {
    id: 'pyp',
    name: 'PYP',
    fullName: 'Pirofosfat',
    description: 'Kalp kan havuzu ve enfarkt görüntüleme.',
    preparationSteps: [
      '2-10 mL Tc-99m ekleyin.',
      'Çözünene kadar karıştırın.',
      'In-vivo etiketleme yapılacaksa hasta hazırlığına (enjeksiyon öncesi) dikkat edin.'
    ]
  },
  {
    id: 'sc',
    name: 'Sülfür Kolloid',
    fullName: 'Kükürt Kolloid',
    description: 'Karaciğer-Dalak-Kemik İliği-Sentinel Nodu.',
    preparationSteps: [
      'Tc-99m ekle -> Çözelti A (HCl) ekle -> Karıştır.',
      'Kaynar su banyosunda 5 dk beklet (KC/Dalak için).',
      'Soğut -> Çözelti B (Buffer) ekle -> Karıştır.',
      '6 saat içinde tüketin.'
    ],
    prepTimerMinutes: 5
  },
  {
    id: 'nanocol',
    name: 'Nanocol',
    fullName: 'Nanokolloid',
    description: 'Sentinel Lenf Nodu ve Kemik İliği.',
    preparationSteps: [
      '1-5 mL (5-150 mCi) Tc-99m ekleyin.',
      'Hava iğnesi kullanmayın.',
      'Hafifçe alt üst ederek karıştırın.',
      'Oda sıcaklığında 30 dk bekletin.',
      '6 saat içinde tüketin.'
    ],
    prepTimerMinutes: 30
  }
];

export const CONVERSION_FACTOR = 37; // 1 mCi = 37 MBq
