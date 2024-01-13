const Rcon = require('rcon-client').Rcon;
const { ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      if (interaction.customId === 'cluster-command') {
        const validService = async (services) => {
          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Restart Cluster')
                .setCustomId('restart-cluster')
                .setStyle(ButtonStyle.Success)
                .setDisabled(false),

              new ButtonBuilder()
                .setLabel('Stop Cluster')
                .setCustomId('stop-cluster')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟠\` \`${services.length} Gameservers Pending\`\n\n**Additional Information**\nSelect dismiss message to return.`)

          await interaction.reply({ embeds: [embed], components: [button], ephemeral: false });
        }

        const validToken = async (nitrado) => {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          const services = response.data.data.services;
          response.status === 200 ? validService(services) : invalidService()
        }

        const validDocument = async ({ nitrado }) => {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
        }

        const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data()
        reference ? validDocument(reference) : console.log('Error')
      };

      if (interaction.customId === 'restart-cluster') {
        const message = await interaction.message;

        const success = async (data) => {
          await interaction.deferReply()

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Restart Cluster')
                .setCustomId('restart-cluster')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),

              new ButtonBuilder()
                .setLabel('Stop Cluster')
                .setCustomId('stop-cluster')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟢\` \`${data.length} Gameservers Restarting\`\n\n**Additional Information**\nDeletion:  <t:${Math.floor(Date.now() / 1000) + 15}:R>`)

          const info = await interaction.followUp({ content: 'Data Fetch Success - API Online', ephemeral: false })
          await message.edit({ embeds: [embed], components: [button] })
            .then(() => setTimeout(() => { message.delete(); info.delete(); }, 13000));
        };

        const validService = async (nitrado, services) => {
          const promise = await services.map(async service => {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/restart`;
            return axios.post(url, { message: 'Obelisk Cluster-Wide Restart' }, { headers: { 'Authorization': nitrado.token } });
          });

          const data = [];
          const responses = await Promise.all(promise);
          responses.forEach(responses => { data.push(responses.status) });
          success(data)
        };

        const validToken = async (nitrado) => {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          const services = response.data.data.services;
          response.status === 200 ? validService(nitrado, services) : invalidService()
        };

        const validDocument = async ({ nitrado }) => {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
        };

        const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data()
        reference ? validDocument(reference) : console.log('Error')
      };

      if (interaction.customId === 'stop-cluster') {
        const message = await interaction.message;

        const success = async (data) => {
          await interaction.deferReply()

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Restart Cluster')
                .setCustomId('restart-cluster')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),

              new ButtonBuilder()
                .setLabel('Stop Cluster')
                .setCustomId('stop-cluster')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setDescription(`**Pending Action Authorization**\nGrant permission to access your services.\nPerform a cluster-wide server action.\n\`🟢\` \`${data.length} Gameservers Stopping\`\n\n**Additional Information**\nDeletion:  <t:${Math.floor(Date.now() / 1000) + 15}:R>`)

          const info = await interaction.followUp({ content: 'Data Fetch Success - API Online', ephemeral: false })
          await message.edit({ embeds: [embed], components: [button] })
            .then(() => setTimeout(() => { message.delete(); info.delete(); }, 13000));
        };

        const validService = async (nitrado, services) => {
          const promise = await services.map(async service => {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers/stop`;
            return axios.post(url, { message: 'Obelisk Cluster-Wide Stop' }, { headers: { 'Authorization': nitrado.token } });
          });

          const data = [];
          const responses = await Promise.all(promise);
          responses.forEach(responses => { data.push(responses.status) });
          success(data)
        };

        const validToken = async (nitrado) => {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          const services = response.data.data.services;
          response.status === 200 ? validService(nitrado, services) : invalidService()
        };

        const validDocument = async ({ nitrado }) => {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validToken(nitrado) : console.log('Invalid token'), null;
        };

        const reference = (await db.collection('configuration').doc(interaction.guild.id).get()).data()
        reference ? validDocument(reference) : console.log('Error')
      };

      if (interaction.customId === 'auto-maintanance') {
        // Add in later version...
      };
    });
  },
};