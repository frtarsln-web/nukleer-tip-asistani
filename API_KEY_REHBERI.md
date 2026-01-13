# PDF/JPG Yükleme için API Key Ekleme Rehberi

## 🔑 Kendi Gemini API Key'inizi Ekleme

Eğer PDF ve JPG dosyalarını da yükleyebilmek istiyorsanız, ücretsiz Google Gemini API key alıp ekleyebilirsiniz.

### Adım 1: API Key Alma (Ücretsiz)

1. **Google AI Studio**'ya gidin: https://aistudio.google.com/app/apikey
2. Google hesabınızla giriş yapın
3. **"Create API Key"** butonuna tıklayın
4. API key'i kopyalayın (örnek: `AIzaSy...`)

### Adım 2: API Key'i Ekleme

Projenizde `.env.local` dosyasını açın (yoksa oluşturun):

\`\`\`bash
# Dosya yolu:
# nükleer-tıp-asistanı-yeni/.env.local
\`\`\`

İçine şunu ekleyin:

\`\`\`env
VITE_GEMINI_API_KEY=BURAYA_API_KEYINIZI_YAPIŞTIRIN
\`\`\`

**Örnek:**
\`\`\`env
VITE_GEMINI_API_KEY=AIzaSyABCDEF1234567890
\`\`\`

### Adım 3: Uygulamayı Yeniden Başlatın

1. Terminal'de `Ctrl+C` ile dev server'ı durdurun
2. `npm run dev` ile yeniden başlatın
3. Artık PDF/JPG yükleyebilirsiniz! 🎉

---

## 📊 Kota Bilgileri

**Ücretsiz Plan:**
- **1,500** requests/gün
- **1 milyon** tokens/ay
- Kredi kartı gerekmez!

---

## ⚠️ Önemli Notlar

1. `.env.local` dosyası `.gitignore`'da olmalı (güvenlik için)
2. API key'i kimseyle paylaşmayın
3. Kota biterse CSV kullanabilirsiniz
4. Ücretsiz plan çoğu kullanım için yeterli

---

## 🆚 CSV vs AI Karşılaştırması

| Özellik | CSV | AI (PDF/JPG) |
|---------|-----|--------------|
| Hız | ⚡ Çok Hızlı | 🐌 Yavaş (3-5sn) |
| Güvenilirlik | ✅ %100 | ⚠️ %95 |
| API Gereksinimi | ❌ Hayır | ✅ Evet |
| Offline Çalışır | ✅ Evet | ❌ Hayır |
| Maliyet | 🆓 Ücretsiz | 🆓 Ücretsiz (kota dahilinde) |

**Öneri:** Günlük kullanım için CSV daha pratik!
