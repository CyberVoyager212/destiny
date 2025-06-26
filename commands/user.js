const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const moment = require('moment');

module.exports = {
    name: 'user',
    description: 'Kullanıcı bilgilerini gösterir (avatar, banner, izinler, genel bilgi)',
    usage: 'user <avatar/banner/izinler/bilgi/help>',

    async execute(client, message, args) {
        if (!args[0]) return message.reply("Lütfen bir seçenek girin: `avatar`, `banner`, `izinler`, `bilgi`, `help`");

        const user = message.mentions.members.first() || message.guild.members.cache.get(args[1]) || message.member;

        if (args[0].toLowerCase() === 'help') {
            const helpEmbed = new MessageEmbed()
                .setTitle('User Komut Yardımı')
                .setColor('BLUE')
                .setDescription('Aşağıdaki seçeneklerden birini kullanabilirsiniz:')
                .addFields(
                    { name: '`!user avatar [@kullanıcı]`', value: 'Kullanıcının avatarını gösterir.' },
                    { name: '`!user banner [@kullanıcı]`', value: 'Kullanıcının banner resmini gösterir.' },
                    { name: '`!user izinler [@kullanıcı]`', value: 'Kullanıcının sunucu ve kanal izinlerini listeler.' },
                    { name: '`!user bilgi [@kullanıcı]`', value: 'Kullanıcının genel bilgilerini (ID, roller, tarih vb.) gösterir.' }
                )
                .setFooter({ text: `Komut isteyen: ${message.author.tag}` });

            return message.channel.send({ embeds: [helpEmbed] });
        }

        if (args[0].toLowerCase() === 'avatar') {
            const avatar = user.user.displayAvatarURL({ dynamic: true, size: 512 });

            const embed = new MessageEmbed()
                .setTitle(`${user.user.username}'in Avatarı`)
                .setImage(avatar)
                .setColor('BLUE');

            return message.channel.send({ embeds: [embed] });

        } else if (args[0].toLowerCase() === 'banner') {
            fetch(`https://discord.com/api/users/${user.id}`, {
                headers: { Authorization: `Bot ${client.token}` }
            })
                .then(res => res.json())
                .then(body => {
                    if (body.banner) {
                        const extension = body.banner.startsWith('a_') ? '.gif' : '.png';
                        const bannerUrl = `https://cdn.discordapp.com/banners/${user.id}/${body.banner}${extension}?size=1024`;

                        const embed = new MessageEmbed()
                            .setTitle(`${user.user.username}'in Banner Resmi`)
                            .setImage(bannerUrl)
                            .setColor('BLUE');

                        message.channel.send({ embeds: [embed] });
                    } else {
                        message.reply(`${user.user.username} kullanıcısının bir banner'ı yok.`);
                    }
                });

        } else if (args[0].toLowerCase() === 'izinler') {
            const sp = user.permissions.serialize();
            const cp = message.channel.permissionsFor(user).serialize();

            const embed = new MessageEmbed()
                .setColor(user.displayColor || 'GREY')
                .setTitle(`${user.displayName}'in İzinleri`)
                .setDescription([
                    '\\♨️ - Sunucu Genel',
                    '\\#️⃣ - Bulunduğun Kanal',
                    '```properties',
                    '♨️ | #️⃣ | İzin',
                    '========================================',
                    `${Object.keys(sp)
                        .map(perm =>
                            [
                                sp[perm] ? '✅ |' : '❌ |',
                                cp[perm] ? '✅ |' : '❌ |',
                                perm
                                    .split('_')
                                    .map(x => x[0] + x.slice(1).toLowerCase())
                                    .join(' '),
                            ].join(' ')
                        )
                        .join('\n')}`,
                    '```'
                ].join('\n'))
                .setFooter({ text: `Komut isteyen: ${message.author.tag}` });

            return message.channel.send({ embeds: [embed] });

        } else if (args[0].toLowerCase() === 'bilgi') {
            const checkDays = date => {
                let now = new Date();
                let diff = now.getTime() - date.getTime();
                let days = Math.floor(diff / 86400000);
                return days + (days == 1 ? ' gün' : ' gün önce');
            };

            fetch(`https://discord.com/api/users/${user.id}`, {
                headers: { Authorization: `Bot ${client.token}` }
            })
                .then(res => res.json())
                .then(body => {
                    const bannerUrl = body.banner
                        ? `https://cdn.discordapp.com/banners/${user.id}/${body.banner}.${body.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`
                        : null;

                    const embed = new MessageEmbed()
                        .setTitle(`${user.user.username} Kullanıcı Bilgisi`)
                        .setThumbnail(user.user.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setColor(body.accent_color || 'BLUE')
                        .addFields(
                            { name: 'Kullanıcı Adı', value: user.user.tag },
                            { name: 'Kullanıcı ID', value: user.user.id },
                            { name: 'Hesap Oluşturulma Tarihi', value: `${moment(user.user.createdAt).format('LLLL')} (${checkDays(user.user.createdAt)})` },
                            { name: 'Sunucuya Katılma Tarihi', value: `${moment(user.joinedAt).format('LLLL')} (${checkDays(user.joinedAt)})` },
                            { name: 'En Yüksek Rol', value: `<@&${user.roles.highest.id}>` },
                            { name: 'Roller', value: user.roles.cache.map(r => `${r}`).join(' | ') }
                        )
                        .setImage(bannerUrl)
                        .setFooter({ text: `Komut isteyen: ${message.author.tag}` })
                        .setTimestamp();

                    message.channel.send({ embeds: [embed] });
                });

        } else {
            return message.reply("Geçersiz seçenek! Kullanılabilir seçenekler: `avatar`, `banner`, `izinler`, `bilgi`, `help`");
        }
    }
};
module.exports.help = {
    name: "user",
    description: "Kullanıcı bilgilerini gösterir (avatar, banner, izinler, genel bilgi)",
    usage: "user <avatar/banner/izinler/bilgi/help>",
};