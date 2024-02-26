const { ActionRowBuilder, Events, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const validService = async (nitrado, status, services) => {
        try {
          const platforms = { arksa: true };
          const channel = await client.channels.fetch(status.channel);
          const message = await channel.messages.fetch(status.message);

          let current = 0, total = 0;
          const actions = await Promise.all(
            services.map(async (service) => {
              if (platforms[service.details.folder_short]) {
                const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
                const response = await axios.get(url, { headers: { Authorization: nitrado.token } });
                const { status, query } = response.data.data.gameserver;
                const { suspend_date } = service;

                if (status === 'started' && query.player_current > 0 && query.player_max > 0) { current += query.player_current, total += query.player_max };
                return { status, query, service, suspend_date };
              }
            })
          );

          const sortedActions = actions
            .filter((action) => action) // Filtering out undefined values
            .sort((a, b) => b.query.player_current - a.query.player_current); // Sorting based on current population

          let output = '';
          sortedActions.slice(0, 15).forEach((action) => {
            const { status, query, service, suspend_date } = action;
            const time = new Date(suspend_date).getTime() / 1000;

            switch (status) {
              case 'started':
                output += `\`🟢\` \`Service Online\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'restarted':
                output += `\`🟠\` \`Service Restarting\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'updating':
                output += `\`🟠\` \`Service Updating\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'stopping':
                output += `\`🔴\` \`Service Stopping\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;
              case 'stopped':
                output += `\`🔴\` \`Service Stopped\`\n${query.server_name ? query.server_name.slice(0, 40) : 'Data Fetch Error - API Outage'}\nPlayer Count: \`${query.player_current ? query.player_current : 0}/${query.player_max ? query.player_max : 0}\`\nID: ||${service.id}||\n\n**Server Runtime**\n<t:${time}:f>\n\n`;
                break;

              default:
                break;
            }
          });

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Cluster Command')
                .setCustomId('cluster-command')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setLabel('Auto Maintanance')
                .setCustomId('auto-maintanance')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}**Cluster Player Count**\n \`🌐\` \`(${current}/${total})\`\n\n<t:${Math.floor(Date.now() / 1000)}:R>\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/)**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png');

          await message.edit({ embeds: [embed], components: [button] });

        } catch (error) {
          if (error.code === 50001) console.log('Missing access'), null;
        };
      };

      const validToken = async (nitrado, status) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        const services = response.data.data.services;
        response.status === 200 ? validService(nitrado, status, services) : invalidService()
      };

      const validDocument = async ({ nitrado, status }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validToken(nitrado, status) : console.log('Invalid token');
        } catch (error) { null };
      };

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 5000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};

