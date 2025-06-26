const { MessageEmbed } = require("discord.js");
const moment = require('moment');

const status = {
    online: "Çevrimiçi",
    idle: "Boşta",
    dnd: "Rahatsız Etmeyin",
    offline: "Çevrimdışı/Görünmez"
};

module.exports = {
    config: {
        name: "whois",
        description: "Kullanıcı bilgilerini gösterir.",
        usage: "m/whois <üye etiketle/üye id>",
        aliases: ['ui', 'userinfo']
    },
    execute: async (client, message, args) => {
        var permissions = [];
        var acknowledgements = 'Yok';
        let whoisPermErr = new MessageEmbed()
            .setTitle("**Kullanıcı İzin Hatası!**")
            .setDescription("**Üzgünüz, bunu kullanmak için yetkiniz yok! ❌**");

        // Yalnızca "MANAGE_MESSAGES" iznine sahip kullanıcılar komutu kullanabilir
        if (!message.channel.permissionsFor(message.author).has("MANAGE_MESSAGES")) return message.channel.send({ embeds: [whoisPermErr] });

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (member.permissions.has("KICK_MEMBERS")) {
            permissions.push("Üyeleri At");
        }

        if (member.permissions.has("BAN_MEMBERS")) {
            permissions.push("Üyeleri Yasakla");
        }

        if (member.permissions.has("ADMINISTRATOR")) {
            permissions.push("Yönetici");
        }

        if (member.permissions.has("MANAGE_MESSAGES")) {
            permissions.push("Mesajları Yönet");
        }

        if (member.permissions.has("MANAGE_CHANNELS")) {
            permissions.push("Kanalları Yönet");
        }

        if (member.permissions.has("MENTION_EVERYONE")) {
            permissions.push("Herkesi Etiketle");
        }

        if (member.permissions.has("MANAGE_NICKNAMES")) {
            permissions.push("Takma Adları Yönet");
        }

        if (member.permissions.has("MANAGE_ROLES")) {
            permissions.push("Rolleri Yönet");
        }

        if (member.permissions.has("MANAGE_WEBHOOKS")) {
            permissions.push("Web Kancalarını Yönet");
        }

        if (member.permissions.has("MANAGE_EMOJIS_AND_STICKERS")) {  // Bu satırda değişiklik yapıldı
            permissions.push("Emojileri ve Çıkartmaları Yönet");
        }

        if (permissions.length == 0) {
            permissions.push("Anahtar İzinler Bulunamadı");
        }

        if (member.user.id == message.guild.ownerID) {
            acknowledgements = 'Sunucu Sahibi';
        }

        const embed = new MessageEmbed()
            .setDescription(`<@${member.user.id}>`)
            .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL())
            .setColor('#2F3136')
            .setFooter(`ID: ${message.author.id}`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp()
            .addField('__Katılma Tarihi:__ ', `${moment(member.joinedAt).format("dddd, MMMM Do YYYY, HH:mm:ss")}`)
            .addField('__Hesap Oluşturulma Tarihi__', member.user.createdAt.toLocaleString())
            .addField(`\n__Roller [${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `\`${roles.name}\``).length}]__`, `${member.roles.cache.filter(r => r.id !== message.guild.id).map(roles => `<@&${roles.id}>`).join(" **|** ") || "Rol Yok"}`)
            .addField("\n__Ayrıcalıklar:__ ", `${acknowledgements}`)
            .addField("\n__İzinler:__ ", `${permissions.join(` | `)}`);

        message.channel.send({ embeds: [embed] });
    },

    help: {
        name: "whois",
        description: "Bir kullanıcının bilgilerini gösterir.",
        usage: "whois <üye etiketle/üye id>",
    }
};
