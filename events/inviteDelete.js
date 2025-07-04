module.exports = async (client, invite) => {
  const cachedInvites = client.invites.get(invite.guild.id);
  if (cachedInvites) {
    cachedInvites.delete(invite.code);
    client.invites.set(invite.guild.id, cachedInvites);
  }
};
