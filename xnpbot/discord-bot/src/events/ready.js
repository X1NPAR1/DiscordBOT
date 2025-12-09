module.exports = {
  name: 'ready',
  once: true,
  execute(client, config) {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı`);
  }
};
