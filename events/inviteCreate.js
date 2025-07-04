module.exports = async (client, invite) => {
  const invites = await invite.guild.invites.fetch();
  const inviteMap = new Map();
  invites.forEach((inv) =>
    inviteMap.set(inv.code, { uses: inv.uses, inviter: inv.inviter?.id })
  );
  client.invites.set(invite.guild.id, inviteMap);
};
