const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } = require('discord.js');
const fs = require('fs');
const path = require('path');
const botConfig = require('../botConfig.js'); // botConfig.js dosyasını içe aktarıyoruz

exports.execute = async (client, message, args) => {
    // Kullanıcının yetkisini kontrol et
    if (!botConfig.admins.includes(message.author.id)) {
        return message.reply("⛔ Bu komutu kullanmak için yetkiniz yok!");
    }

    const guild = message.guild;
    const logFolder = path.join(__dirname, "ticket_logs");

    if (!fs.existsSync(logFolder)) return message.reply("Henüz hiç kayıtlı bilet yok.");
    
    const logs = fs.readdirSync(logFolder).filter(file => file.endsWith(".txt"));
    if (!args[0]) {
        let logList = logs.slice(0, 10).map(log => log.replace(".txt", "")).join("\n");
        return message.reply(`📋 Mevcut Bilet ID'leri:\n${logList}`);
    }
    
    const logId = args[0];
    const logPath = path.join(logFolder, `${logId}.txt`);
    if (!fs.existsSync(logPath)) return message.reply("Belirtilen ID'ye sahip bilet bulunamadı.");
    
    const logData = fs.readFileSync(logPath, "utf8");
    guild.channels.create(`log-${logId}`, { type: "GUILD_TEXT" }).then(channel => {
        const chunks = logData.match(/.{1,2000}/g) || [];
        chunks.forEach(chunk => channel.send(chunk));
    });
};

exports.help = {
    name: "ticketlog",
    aliases: [],
    usage: "ticketlog [id]",
    description: "Mevcut biletleri listeler veya belirtilen ID'yi gösterir."
};
