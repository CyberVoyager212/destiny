const crypto = require('crypto');

exports.help = {
  name: "şifrelimesaj",
  description: "Mesajı şifreler veya şifrelenmiş mesajı çözer.",
  usage: "şifrelimesaj [şifrele|çöz] [kaç kere] [metin veya şifrelenmiş metin]",
  aliases: ["şm", "şifrelim", "şmesaj", "şifre"],
};

const MAX_ENCRYPTION_LIMIT = 10; // Maksimum şifreleme limiti

exports.execute = async (client, message, args) => {
  if (args[0] === 'şifrele') {
    // Şifreleme işlemi
    let repeat = parseInt(args[1]); // Şifreleme tekrar sayısını al
    let textIndex = isNaN(repeat) ? 1 : 2; // Eğer sayı değilse, metin 1. indexten başlar
    let text = args.slice(textIndex).join(' ');

    if (!text) {
      return message.reply('Lütfen şifrelemek için bir metin girin.');
    }

    if (isNaN(repeat) || repeat < 1) repeat = 1; // Geçerli bir sayı değilse 1 yap
    if (repeat > MAX_ENCRYPTION_LIMIT) repeat = MAX_ENCRYPTION_LIMIT; // Maksimum limiti aşma

    let encryptedText = text;
    for (let i = 0; i < repeat; i++) {
      encryptedText = encryptText(encryptedText);
    }

    await message.channel.send(`Şifrelenmiş Mesaj (${repeat} kez): \`${encryptedText}\``);
  } else if (args[0] === 'çöz') {
    // Şifre çözme işlemi
    let encryptedText = args.slice(1).join(' ');
    if (!encryptedText) {
      return message.reply('Lütfen şifrelenmiş bir metin girin.');
    }

    try {
      let decryptedText = encryptedText;

      // Eğer şifre çözülmüş metin de tekrar bir hex koduysa onu da çöz
      while (isHex(decryptedText)) {
        decryptedText = decryptText(decryptedText);
      }

      await message.channel.send(`Çözülen Mesaj: \`${decryptedText}\``);
    } catch (error) {
      return message.reply('Şifre çözme sırasında bir hata oluştu. Lütfen geçerli bir şifrelenmiş metin girin.');
    }
  } else {
    return message.reply('Geçersiz kullanım. Lütfen `şifrele` veya `çöz` seçeneklerinden birini kullanın.');
  }
};

// Şifreleme fonksiyonu
function encryptText(text) {
  const cipher = crypto.createCipher('aes-256-cbc', 'sifrelemeAnahtari');
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Şifre çözme fonksiyonu
function decryptText(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', 'sifrelemeAnahtari');
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Verinin hex olup olmadığını kontrol eden fonksiyon
function isHex(str) {
  return /^[0-9A-Fa-f]+$/.test(str) && str.length % 2 === 0;
}
