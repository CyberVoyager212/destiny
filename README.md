# 🎯 Destiny Discord Botu

## 🔍 Genel Bakış

**Destiny**, JavaScript (Node.js) ile geliştirilen, moderasyon, eğlence, ekonomi ve yardımcı araçları bir araya getiren çok amaçlı bir Discord botudur. Sunuculara hem işlevsellik hem de interaktif eğlence katmak amacıyla tasarlanmıştır.

> 📅 **Not:** Bu belge 4 Temmuz 2025 tarihinde hazırlanmıştır. Proje hâlâ geliştirilmektedir ve çok yakında tam sürümüyle yayınlanacaktır.

---

## 🚀 Özellikler

### 🔧 Moderasyon

Sunucunuzun düzenini korumanız için:

* `!ban`, `!kick`, `!mute`, `!uyarı`, `!temizle` gibi komutlar

### 🎉 Eğlence

Topluluğunuzu eğlendirin:

* Yazı tura, şakalar, resim efektleri, mini oyunlar

### 💰 Ekonomi Sistemi

Sunucunuza sanal ekonomi ekleyin:

* "Destinex" para birimi
* Slot, kumar, alışveriş ve daha fazlası

### 🌐 Yardımcı Araçlar

Günlük işlerinizi kolaylaştıracak komutlar:

* Hava durumu, çeviri, hesap makinesi vb.

### ⚡ Olay Dinleyicileri

Gerçek zamanlı olaylara otomatik tepkiler:

* Kullanıcı giriş/çıkışları, mesaj oluşturma/silme vb.

---

## ⚙️ Gereksinimler

* [Node.js](https://nodejs.org/) v16 veya üzeri
* [Discord Developer Portal](https://discord.com/developers/applications) üzerinden alınan bot tokeni
* `npm` (Node.js ile birlikte gelir)

---

## 🛠️ Kurulum

1. **Projeyi klonlayın:**

   ```bash
   git clone https://github.com/CyberVoyager212/destiny-.git
   cd destiny
   ```

2. **Gerekli bağımlılıkları yükleyin:**

   ```bash
   npm install
   ```

3. **Yapılandırma dosyasını oluşturun:**
   Proje dizinine `botConfig.js` adında bir dosya oluşturun:

   ```js
   module.exports = {
     token: "",           // Discord bot tokeniniz
     prefix: "!",         // Komut ön eki
     admins: [""],        // Yetkili kullanıcı ID'leri
     AI21_API_KEY: "",    // (Opsiyonel) AI21 API anahtarı
     SERPER_API_KEY: ""   // (Opsiyonel) Serper API anahtarı
   };
   ```

   > 🔐 Güvenlik için bu dosyayı `.gitignore` içine eklemeyi unutmayın!

4. **Botu çalıştırın:**

   ```bash
   node index.js
   ```

---

## 💬 Komut Örnekleri

| Komut                          | Açıklama                                |
| ------------------------------ | --------------------------------------- |
| `!ban @kullanıcı Sebep`        | Belirtilen kullanıcıyı sunucudan banlar |
| `!yazıtura`                    | Yazı-tura oyunu oynar                   |
| `!sunucubilgi`                 | Sunucu hakkında özet bilgi verir        |
| `!translate en tr Hello world` | İngilizce'den Türkçe'ye çeviri yapar    |

---

## 🧩 Emoji Rehberi

### 💰 Ekonomi Emojileri

* 👜 Çuval Destinex
* 💵 Banknot Destinex
* 🪙 Bozukluk Destinex

### 🎰 Slot Makinesi Emojileri

* 🔄 Dönme animasyonu
* ❎ 2x çarpan
* ✅ 3x çarpan
* 💯 4x çarpan

### 🔫 Rulet Emojileri

* 🔫 Ateş eden silah
* 🔫 Emniyette olan silah

### 📶 Ping Emojileri

* 1️⃣ \~ 4️⃣ seviyeli Wi-Fi simgeleri

### 🃏 Kart Oyunları

* **Poker** → `games/` klasöründe
* **Blackjack** → `commands/` klasöründe
* Kart emojileri oyunlarla entegredir.

> 💡 Emojileri manuel eklemek istemiyorsanız, [bu sunucuya katılabilirsiniz](https://discord.gg/9yHudfpq).
> Botun sunduğu **emoji klonlama komutları** ile tüm emojileri kendi sunucunuza aktarabilirsiniz.
> Not: Emoji ID’leri sunucudan sunucuya değişebilir.

---

## 🗂️ Proje Yapısı

```
├── commands/         → Komutlar
├── events/           → Discord olayları
├── games/            → Oyun mantıkları (slot, poker vb.)
├── index.js          → Ana bot dosyası
├── botConfig.js      → Yapılandırma dosyası (manuel oluşturulur)
├── json.sqlite       → SQLite veritabanı
```

> 🧠 `events` klasörü büyük ölçüde hazır. `commands` klasöründe düzenlemeler yapılmış olabilir.

---

## 🤝 Katkıda Bulunmak

Projeye destek olmak ister misiniz?

1. Reponun bir fork’unu alın
2. Yeni bir dal (branch) oluşturun
3. Geliştirmelerinizi yapın, açıklayıcı commit mesajları kullanın
4. Pull request gönderin 🚀

> Lütfen kod stiline ve proje yapısına uygun kalmaya dikkat edin.

---

## 🙏 Teşekkürler

* Bot geliştirme sürecinde [discord.js](https://discord.js.org/) kütüphanesi kullanılmıştır.
* Ekonomi sistemi, [ZeroDiscord/EconomyBot](https://github.com/ZeroDiscord/EconomyBot) projesinden ilham alınarak oluşturulmuştur.
* Projenin geliştiricisi: **Mustafa Sepet**

---
