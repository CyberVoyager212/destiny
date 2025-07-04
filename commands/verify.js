const { MessageAttachment } = require("discord.js");
const { createCanvas } = require("canvas");

const generateCaptcha = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let captcha = "";
  // 6 adet rastgele harf seç
  for (let i = 0; i < 6; i++) {
    captcha += letters[Math.floor(Math.random() * letters.length)];
  }
  return captcha;
};

const generateCaptchaImage = (captchaText) => {
  const canvasWidth = 200;
  const canvasHeight = 70;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Arka planı ayarla
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const fontSize = 30;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "middle";

  const numLetters = captchaText.length; // 6 harf olacak
  const verticalDeviation = canvasHeight * 0.05; // Yaklaşık ±5% sapma (3-4 piksel)
  const positions = [];
  const measurements = [];

  // Harflerin tamamen görünmesi için yatayda margin tanımlıyoruz
  const margin = 10; // Sol ve sağdan 10 piksel boşluk

  // Harfleri, ilk harf margin'den başlayıp, son harf canvasWidth - margin'de bitecek şekilde eşit aralıklarla yerleştiriyoruz.
  for (let i = 0; i < numLetters; i++) {
    const x = margin + ((canvasWidth - 2 * margin) / (numLetters - 1)) * i;
    const baseY = canvasHeight / 2;
    // Her harfin y konumuna ±sapma ekle
    const y =
      baseY + (Math.random() * 2 * verticalDeviation - verticalDeviation);
    positions.push({ x, y });
    const metrics = ctx.measureText(captchaText[i]);
    measurements.push(metrics.width);
  }

  // Harfleri çiz
  for (let i = 0; i < numLetters; i++) {
    ctx.fillText(captchaText[i], positions[i].x, positions[i].y);
  }

  // Çizgi çizimi
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  ctx.beginPath();

  // İlk harfin sol alt köşesi: harfin solundan biraz (yarı genişlik kadar) ve altından fontSize/2 kadar
  const startX = positions[0].x - measurements[0] / 2;
  const startY = positions[0].y + fontSize / 2;
  ctx.moveTo(startX, startY);

  // İkinci harften beşinci harfe kadar: harflerin ortalarından (hafif rastgele sapmayla) geçiyor
  for (let i = 1; i < numLetters - 1; i++) {
    const extraOffset = Math.random() * (fontSize * 0.1) - fontSize * 0.05;
    ctx.lineTo(positions[i].x, positions[i].y + extraOffset);
  }

  // Son harfin sağ üst köşesi: harfin sağından biraz (yarı genişlik kadar) ve üstünden fontSize/2 kadar
  const lastIdx = numLetters - 1;
  const endX = positions[lastIdx].x + measurements[lastIdx] / 2;
  const endY = positions[lastIdx].y - fontSize / 2;
  ctx.lineTo(endX, endY);

  ctx.stroke();

  return canvas.toBuffer();
};

// Sunuculara özel rol ve kanal ID'lerini yapılandırma
const verificationRolesAndChannels = {
  "1062038893463085147": {
    roleID: "1062043377195044975", // Doğrulama rolü ID'si
    channelID: "1345715982945226755", // Komutun çalışacağı kanal ID'si
    customRoleID: null, // Bu sunucuda özel bir rol ID'si yok
  },
  "1335199328607801434": {
    roleID: "1335199328607801436",
    channelID: "1345750223011450962",
    customRoleID: "1335199328607801435", // Bu sunucuda özel bir rol ID'si
  },
};

exports.execute = async (client, message, args) => {
  const { guild, member, channel } = message;

  // Sunucuya göre kanal ve rol ID'lerini al
  const verificationRoleID = verificationRolesAndChannels[guild.id]?.roleID;
  const allowedChannelID = verificationRolesAndChannels[guild.id]?.channelID;
  const customRoleID = verificationRolesAndChannels[guild.id]?.customRoleID;

  if (!verificationRoleID || !allowedChannelID) {
    return message.reply("Bu komut bu sunucu için yapılandırılmamış.");
  }

  try {
    // Komutun doğru kanalda olup olmadığını kontrol et
    if (channel.id !== allowedChannelID) {
      const msg = await message.reply(
        "Bu komut sadece belirtilen kanalda çalışabilir!"
      );
      setTimeout(() => msg.delete(), 5000);
      setTimeout(() => message.delete(), 5000); // Kullanıcı komutunu sil
      return;
    }

    if (member.roles.cache.hasAny(verificationRoleID)) {
      const msg = await message.reply("Zaten doğrulanmışsınız!");
      setTimeout(() => msg.delete(), 5000);
      setTimeout(() => message.delete(), 5000); // Kullanıcı komutunu sil
      return;
    }

    const captcha = generateCaptcha();
    const captchaImage = generateCaptchaImage(captcha); // Görseli oluştur

    const filter = (response) => response.author.id === member.id;

    // Resimli mesaj gönder
    const captchaMessage = await message.channel.send({
      content: "Lütfen aşağıdaki CAPTCHA kodunu girin:",
      files: [{ attachment: captchaImage, name: "captcha.png" }], // Görseli mesaj olarak gönder
    });

    let attempts = 0;
    const maxAttempts = 3;
    const captchaTimeout = 50000; // CAPTCHA için süre (50 saniye)

    const checkCaptcha = async () => {
      const response = await message.channel
        .awaitMessages({
          filter,
          max: 1,
          time: captchaTimeout,
          errors: ["time"],
        })
        .catch(() => null); // Süre bitince hata al

      if (response) {
        const userResponse = response.first().content;

        if (userResponse === captcha) {
          // Eğer customRoleID belirtilmişse, bu rolü sil ve yeni rolü ekle
          if (customRoleID) {
            try {
              const role = await guild.roles.fetch(customRoleID);
              if (role) {
                await member.roles.remove(customRoleID); // Eski özel rolü sil
                await member.roles.add(verificationRoleID); // Yeni doğrulama rolünü ekle
                console.log(
                  `Custom role ${role.name} silindi ve doğrulama rolü eklendi.`
                );
              } else {
                console.log("Geçersiz rol ID.");
              }
            } catch (error) {
              console.error("Rol eklenirken hata oluştu:", error);
            }
          }

          // Kullanıcıya doğrulama rolünü ekle
          await member.roles.add(verificationRoleID);

          // Başarı mesajı gönder
          const successMessage = await message.channel.send(
            `Tebrikler, <@${member.id}>! Başarıyla doğrulandınız.`
          );
          setTimeout(() => successMessage.delete(), 5000);

          // Komut mesajını 5 saniye sonra sil
          setTimeout(() => {
            try {
              message.delete(); // Kullanıcı komutunu sil
            } catch (error) {
              console.error("Komut mesajı silinemedi:", error);
            }
          }, 5000); // Kullanıcı komutunu 5 saniye sonra sil

          // Sonuçlar başarıyla tamamlandığında, CAPTCHA mesajını sil
          setTimeout(() => captchaMessage.delete(), 5000);

          // Kullanıcının doğru cevabını sil
          setTimeout(() => response.first().delete(), 5000);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            const retryMsg = await message.channel.send(
              "Yanlış CAPTCHA! Tekrar deneyin."
            );
            setTimeout(() => retryMsg.delete(), 5000); // Hata mesajını 5 saniye sonra sil
            setTimeout(() => response.first().delete(), 5000); // Kullanıcı mesajını 5 saniye sonra sil
            checkCaptcha(); // Tekrar deneme
          } else {
            const failureMsg = await message.channel.send(
              "Doğrulama başarısız! 3 deneme hakkınızı da kullandınız."
            );
            setTimeout(() => failureMsg.delete(), 5000); // Hata mesajını 5 saniye sonra sil
            setTimeout(() => response.first().delete(), 5000); // Kullanıcı mesajını 5 saniye sonra sil
          }
        }
      } else {
        // Süre dolarsa hata mesajı gönder
        const timeoutMsg = await message.channel.send(
          "Doğrulama süresi doldu! Lütfen tekrar komutu kullanın."
        );
        setTimeout(() => timeoutMsg.delete(), 5000); // Hata mesajını 5 saniye sonra sil
        setTimeout(() => captchaMessage.delete(), 5000); // CAPTCHA mesajını 5 saniye sonra sil
      }
    };

    checkCaptcha(); // CAPTCHA'yı kontrol et ve başlat

    setTimeout(() => captchaMessage.delete(), captchaTimeout);
  } catch (error) {
    console.error("Doğrulama sırasında bir hata oluştu:", error);
    const errorMsg = await message.reply(
      "Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin."
    );
    setTimeout(() => errorMsg.delete(), 5000); // Hata mesajını 5 saniye sonra sil
  }
};

exports.help = {
  name: "doğrulama",
  aliases: ["verify"],
  usage: "doğrulama",
  description: "Kullanıcının doğrulama rolü almasını sağlar.",
  category: "Eğlence",
  cooldown: 5,
};
