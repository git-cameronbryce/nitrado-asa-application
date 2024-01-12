const Rcon = require('rcon-client').Rcon;
const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error('error'));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const set = new Set();

    async function loop() {
      const valid = async (chat, { rcon_port, ip, settings: { config: { 'current-admin-password': password } } }) => {
        try {
          const info = { host: ip, port: rcon_port, password: password };
          const rcon = await Rcon.connect(info);

          const regex = /^(?!AdminCmd:).*: (.+)$/gm;
          const response = await rcon.send('getchat');
          const messages = response.match(regex);

          const channel = await client.channels.fetch(chat);
          messages && messages.forEach(async message => set.has(message) || (set.add(message), await channel.send({ content: message })));

        } catch (error) {
          if (error.code === 50035) { console.log('Invalid message.') };
        }
      }

      const validService = async (nitrado, chat, services) => {
        services.forEach(async server => {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          response.status === 200 ? valid(chat, response.data.data.gameserver) : console.log('Error')
        })
      }

      const validToken = async ({ nitrado, chat }) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })

        const services = response.data.data.services;
        response.status === 200 ? validService(nitrado, chat, services) : console.log('Invalid token'), null;
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validToken(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 15000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};