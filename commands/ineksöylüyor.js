const { MessageEmbed } = require('discord.js');

const cowAscii = "\\  ^__^\n \\ (oo)\\_______\n   (__)\\        )\\/\\\n       ||----w |\n       ||     ||";

module.exports = {
    name: "cowsay",
    description: "Bir inek belirttiğiniz mesajı söyler.",
    usage: "cowsay <mesaj>",
    execute: async (client, message, args) => {
        if (!args.length) 
            return message.reply("Lütfen ineğin söylemesi için bir mesaj girin! Kullanım: `cowsay <mesaj>`");

        let text = args.join(" ");
        let cowsayText = makeSpeech(text, cowAscii);

        // Embed mesajı
        let embed = new MessageEmbed()
            .setColor("RANDOM")
            .setTitle("🐄 Cowsay!")
            .setDescription(`\`\`\`${cowsayText}\`\`\``)
            .setFooter({ text: "Moo! 🐄" });

        message.channel.send({ embeds: [embed] });
    }
};

// Konuşma balonu oluşturma fonksiyonu
function makeSpeech(text, cow) {
    let cowlines = cow.split('\n');
    let result = "";
    let length = Math.min(text.length, 25);

    result += " _" + repeatString("_", length) + "_ \n";
    var lines = splittext(text, length);
    for (var i = 0; i < lines.length; i++) {
        let line = lines[i];
        let beginChar = "|";
        let endChar = "|";
        if (i == 0) {
            if (lines.length == 1) {
                beginChar = "<";
                endChar = ">";
            } else {
                beginChar = "/";
                endChar = "\\";
            }
        } else if (i == lines.length - 1) {
            beginChar = "\\";
            endChar = "/";
        }
        let lineLength = line.length;
        let pad = length - lineLength;
        result += `${beginChar} ${line}${repeatString(" ", pad)} ${endChar}\n`;
    }

    result += " -" + repeatString("-", length) + "- \n";

    for (var i = 0; i < cowlines.length; i++) {
        let line = cowlines[i];
        result += repeatString(" ", length + 4) + line + "\n";
    }

    return result;
}

// Metni bölme fonksiyonu
function splittext(text, maxlength) {
    let lines = [];
    let current = "";
    for (var i = 0; i < text.length; i++) {
        let character = text[i];
        switch (character) {
            case '\0': case '\b': case '\t': case '\v': case '\r': case "`":
                continue;
            case '\n':
                lines.push(current);
                current = "";
                continue;
            default:
                current += character;
                break;
        }
        if (current.length >= maxlength) {
            lines.push(current);
            current = "";
        }
    }
    if (current.length > 0) {
        lines.push(current);
    }
    return lines;
}

// Belirtilen uzunlukta karakter dizisi oluşturma
function repeatString(text, length) {
    return text.repeat(length);
}
module.exports.help = {
    name: "cowsay",
    description: "Belirttiğiniz mesajı bir ineğe söyletir.",
    usage: "cowsay <mesaj>"
};