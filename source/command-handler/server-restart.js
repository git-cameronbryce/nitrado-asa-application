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
      admin: interaction.user.id,
    };

    const { identifier, guild, admin } = input;
    const reference = (await db.collection('configuration').doc(guild).get()).data();

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

    const valid = async ({ service_id, query, player_current, player_max }) => {
      const channel = await interaction.client.channels.fetch(reference.audits.server);

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setDescription(`\`📄\` \`Service Restarting\`\n${query.server_name ? `${query.server_name.slice(0, 35)}` : 'Data Fetch Error - API Unsuccessful'}\nPlayer Count: \`${player_current ? player_current : '0'}/${player_max ? player_max : '0'}\`\nID: ||${service_id}||\n\n${interaction.user.id}`)
        .setFooter({ text: 'Tip: Contact support if there are issues.' })
        .setImage('https://i.imgur.com/KJIaG12.jpg')

      return await channel.send({ embeds: [embed] }).then(async () => {
        const url = `https://api.nitrado.net/services/${identifier}/gameservers/restart`;
        const response = await axios.post(url, { message: 'Obelisk Manual Restart' }, { headers: { 'Authorization': reference.nitrado.token } });
        response.status === 200 ? success() : failure();
      });
    }

    try {
      const url = `https://api.nitrado.net/services/${identifier}/gameservers`;
      const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
      response.status === 200 ? valid(response.data.data.gameserver) : failure()

    } catch { failure() }
  }
};
