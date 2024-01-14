const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-restart')
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

        return interaction.reply({ embeds: [embed], ephemeral: true });
      };

      const success = async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Server Command Success**\nGameserver action complete.\nExecuted on \`1\` of \`1\` servers.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/CzGfRzv.png')

        return await interaction.followUp({ embeds: [embed] });
      }

      const failure = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Server Command Failure**\nExecuted on \`0\` of \`1\` servers.\nInvalid server credentials.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/PCD2pG4.png')

        return await interaction.followUp({ embeds: [embed] });
      }

      const log = async (channel) => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Server Command Logging**\n\`🔄\` Restarting :: \`${input.identifier}\`\n\n**Staff Tag Information**\n${input.admin}`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await channel.send({ embeds: [embed] });
      }

      const validService = async (nitrado, audits) => {
        const channel = await interaction.client.channels.fetch(audits.server);
        if (channel) { log(channel) };

        const url = `https://api.nitrado.net/services/${input.identifier}/gameservers/restart`;
        const response = await axios.post(url, { message: 'Obelisk Manual Restart' }, { headers: { 'Authorization': nitrado.token } });
        response.status === 200 ? success() : failure();
      };

      const validToken = async (nitrado, audits) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validService(nitrado, audits) : invalidService()
      };

      const validDocument = async ({ nitrado, audits }) => {
        const url = 'https://oauth.nitrado.net/token';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validToken(nitrado, audits) : console.log('Invalid token'), null;
      };

      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      reference ? validDocument(reference) : console.log('Invalid document'), null;
    });
  }
};
