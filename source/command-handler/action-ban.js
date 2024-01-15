const Rcon = require('rcon-client').Rcon;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-ban')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Required to submit ban action.').setRequired(true)
      .addChoices({ name: 'Breaking Rules', value: 'breaking rules' }, { name: 'Cheating', value: 'cheating' }, { name: 'Behavior', value: 'behavior' }, { name: 'Meshing', value: 'meshing' }, { name: 'Other', value: 'other reasons' })),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      username: interaction.options.getString('username'),
      reason: interaction.options.getString('reason'),
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

      const invalidService = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`** Unauthorized Access **\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      };

      const validGameserver = async ({ rcon_port, ip, settings: { config: { 'current-admin-password': password } } }) => {
        const info = { host: ip, port: rcon_port, password: password };
        const rcon = await Rcon.connect(info);

        const command = await rcon.send(`BanPlayer ${input.username}`);
      };

      const validService = (nitrado, services) => {
        services.forEach(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validGameserver(response.data.data.gameserver) : invalidService()
        })
      }

      const validToken = async (nitrado) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validService(nitrado, response.data.data.services) : invalidService()
      };

      const validDocument = async ({ nitrado }) => {
        const url = 'https://oauth.nitrado.net/token';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
        response.status === 200 ? validToken(nitrado) : invalidService(), null;
      };

      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      reference ? validDocument(reference) : invalidService(), null;
    });
  }
};
