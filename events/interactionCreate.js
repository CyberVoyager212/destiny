module.exports = async (client, interaction) => {
  // Sadece buton etkileşimlerini işle
  if (!interaction.isButton()) return;

  // Eğer customId "rolal_" ile başlıyorsa, bu buton rol alımına aittir.
  if (interaction.customId.startsWith("rolal_")) {
    const roleId = interaction.customId.split("_")[1];
    const member = interaction.member;
    if (!member) {
      return interaction.reply({ content: "Üzgünüm, bu işlemi gerçekleştiremiyorum.", ephemeral: true });
    }

    try {
      if (member.roles.cache.has(roleId)) {
        // Eğer rol varsa, rolü kaldır
        await member.roles.remove(roleId);
        return interaction.reply({ content: "Rolünüz geri alındı.", ephemeral: true });
      } else {
        // Eğer rol yoksa, rolü ekle
        await member.roles.add(roleId);
        return interaction.reply({ content: "Rolünüz verildi.", ephemeral: true });
      }
    } catch (err) {
      console.error("Rol işlemi sırasında hata:", err);
      return interaction.reply({ content: "Bir hata oluştu, lütfen daha sonra tekrar deneyin.", ephemeral: true });
    }
  }
};
