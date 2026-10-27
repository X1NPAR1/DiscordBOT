module.exports = {
  name: 'guildMemberAdd',
  async execute(client, config, member) {
    const autoRoleId = config.roles?.autoRoleId;
    if (!autoRoleId) return;
    try {
      await member.roles.add(autoRoleId, 'Otorol');
      console.log(`${member.user.tag} kullanıcısına otorol verildi`);
    } catch (error) {
      console.error('Otorol verilemedi:', error.message);
    }
  }
};
