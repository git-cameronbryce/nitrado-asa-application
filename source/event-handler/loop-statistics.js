const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const validService = async (nitrado, statistics, services) => {
        try {
          const playerIdentifier = await client.channels.fetch(statistics.players);
          const activeIdentifier = await client.channels.fetch(statistics.active);
          const outageIdentifier = await client.channels.fetch(statistics.outage);

          const responses = await Promise.all(services.map(async service => {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            return await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          }));

          let players = 0, active = [], outage = [];
          const gameservers = responses.map(response => response.data.data.gameserver);
          gameservers.forEach(async gameserver => {
            const { status, query } = gameserver;
            if (status === 'started' && query.player_count > 0 && query.player_max > 0) { players += query.player_current };
            if (status === 'started') active.push(status);
            if (status !== 'started') outage.push(status);
          });

          await playerIdentifier.setName(`Active: ${players} Players`)
          await activeIdentifier.setName(`Active: ${active.length} Servers`)
          await outageIdentifier.setName(`Offline: ${outage.length} Servers`)

        } catch (error) { console.log('Missing statistics'), null };
      };

      const validToken = async (nitrado, statistics) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        response.status === 200 ? validService(nitrado, statistics, services) : invalidService()
      }

      const validDocument = async ({ nitrado, statistics }) => {
        const url = 'https://oauth.nitrado.net/token';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validToken(nitrado, statistics) : console.log('Invalid token'), null;
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 60000);
    }
    loop().then(() => console.log('Loop started:'));
  },
};

