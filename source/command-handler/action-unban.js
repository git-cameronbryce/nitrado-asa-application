const Rcon = require('rcon-client').Rcon;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('@google-cloud/firestore');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-unban')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('username').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const input = {
      username: interaction.options.getString('username'),
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

        return interaction.followUp({ embeds: [embed] });
      };

      let success = 0;
      const validService = async (nitrado, services) => {
        const promise = await services.map(async service => {
          try {
            const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
            const { rcon_port, ip, settings: { config: { 'current-admin-password': password } } } = response.data.data.gameserver;
            const info = { host: ip, port: rcon_port, password: password };

            const rcon = await Promise.race([
              Rcon.connect(info),
              new Promise((resolve, reject) => setTimeout(() => reject(service.id), 2500))
            ]);

            if (rcon.authenticated) { success++ };
            await rcon.send(`UnbanPlayer ${input.username}`);
          } catch (error) { null };
        });

        await Promise.all(promise).then(async () => {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`**Game Command Success**\nGameserver action completed.\nExecuted on \`${success}\` of \`${services.length}\` servers.`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setThumbnail('https://i.imgur.com/CzGfRzv.png')

          await interaction.followUp({ embeds: [embed] });

          await db.collection('player-banned').doc(input.guild).set({
            [input.username]: FieldValue.delete()
          }, { merge: true });
        });
      };

      const validToken = async (nitrado) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validService(nitrado, response.data.data.services) : invalidService()
        } catch (error) { invalidService() };

      };

      const validDocument = async ({ nitrado }) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } })
          response.status === 200 ? validToken(nitrado) : invalidService(), null;
        } catch (error) { invalidService() };
      };

      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      reference ? await validDocument(reference) : invalidService(), null;
    });
  }
};
