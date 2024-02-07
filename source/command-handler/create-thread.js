const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, PermissionsBitField, } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-thread-logging')
    .setDescription('Performs an in-game player action.')
    .addNumberOption(option => option.setName('identifier').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      identifier: interaction.options.getNumber('identifier'),
      guild: interaction.guild.id,
      admin: interaction.user.id
    };

    await interaction.guild.roles.fetch().then(async roles => {
      const role = roles.find(role => role.name === 'Obelisk Permission');

      if (!role || !interaction.member.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Unauthorized Access**\nYou do not have the required permissions.\nPlease ask an administrator for access.\n${role}\n\n ** Additional Information **\nThe role was generated upon token setup.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      };

      const unauthorized = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Unauthorized Access**\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed] });
      };

      const invalid = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Invalid Service Parameter**\nEnsure you provided the correct identifier.\nThis can be found on the status page.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }

      const gameserver = async (reference, services) => {

        const path = async (reference, { service_id, query }) => {
          const adminForum = await interaction.client.channels.fetch(reference.logging.admin);
          const chatForum = await interaction.client.channels.fetch(reference.logging.chat);

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Admin Logging Synchronized**\nEverything has been setup correctly. \nIDs are initializing in our database. \n\n**Logging Release Schedule**\n<t:1707627600:f>\n\nService #: \`${service_id}\``)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          const adminThread = await adminForum.threads.create({
            name: `${query.server_name} - ${service_id}`,
            type: ChannelType.PrivateThread,
            message: { embeds: [embed] }
          });

          const chatThread = await chatForum.threads.create({
            name: `${query.server_name} - ${service_id}`,
            type: ChannelType.PrivateThread,
            message: { embeds: [embed] }
          });

          const data = {
            'admin': { [adminThread.id]: adminThread.id },
            'chat': { [chatThread.id]: chatThread.id }
          };

          await db.collection('configuration').doc(input.guild).set(data, { merge: true }).then(async () => {
            await interaction.followUp({ content: 'Logging thread created!\nDo not duplicate servers!' })
          });
        };

        try {
          const url = `https://api.nitrado.net/services/${input.identifier}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await path(reference, response.data.data.gameserver) };
        } catch (error) { invalid() }
      }


      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
          response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized()
        } catch (error) { unauthorized() };
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } })
          response.status === 200 ? service(reference) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      reference ? await token(reference) : unauthorized();
    })
  }
};