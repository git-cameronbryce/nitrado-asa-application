const ini = require('ini');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-stop')
    .setDescription('Performs a stopping action on selected server.')
    .addNumberOption(option => option.setName('identifier').setDescription('Performs server action, list the exact identification number.').setRequired(true)),

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
          .setDescription(`** Unauthorized Access **\nYou do not have a connected account.\nPlease authorize with your provider.\n\`/setup-account\`\n\n**Additional Information**\nEnsure you follow setup procedures.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      };

      const success = async () => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Server Command Success**\nBackup has been automatically collected.\nNitrado uptime is required to save fully.\n\`🟢\` \`1 Gameservers Stopping\`\n\n**Additional Information**\nNo negative effects to this action.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })

        return await interaction.followUp({ embeds: [embed] });
      };

      let valid = false;
      const gameserver = async (reference, services) => {
        const parse = async (iniData, rcon_port, ip) => {
          try {
            const password = iniData['ServerSettings']['ServerAdminPassword'];
            const info = { host: ip, port: rcon_port, password: password };

            const rcon = await Promise.race([Rcon.connect(info),
            new Promise((_, reject) => setTimeout(() => reject(), 2500))
            ]);

            if (rcon.authenticated) {
              await rcon.send(`SaveWorld`);
            };

          } catch (error) { null };
        };

        const data = async (rcon_port, ip, { url }) => {
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await parse(ini.parse(response.data), rcon_port, ip) };
        };

        const path = async ({ service_id, rcon_port, ip, username }) => {
          const url = `https://api.nitrado.net/services/${service_id}/gameservers/file_server/download?file=/games/${username}/ftproot/arksa/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await data(rcon_port, ip, response.data.data.token) };
        };

        const tasks = services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          await path(response.data.data.gameserver);

          if (input.identifier === service.id) {
            const url = `https://api.nitrado.net/services/${input.identifier}/gameservers/stop`;
            const response = await axios.post(url, { message: `Obelisk Manual Stop: ${interaction.user.id}` }, { headers: { 'Authorization': reference.nitrado.token } });
            if (response.status === 200) {
              console.log(`Gameserver stopping: ${response.status}`);
              valid = true, await success();
            };
          };
        });

        await Promise.all(tasks).then(async () => {
          if (!valid) { await interaction.followUp({ content: 'Invalid service identifier!' }) }
        });
      };

      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? gameserver(reference, response.data.data.services) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await axios.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          response.status === 200 ? service(reference) : unauthorized();
        } catch (error) { unauthorized() };
      };

      const reference = (await db.collection('configuration').doc(input.guild).get()).data();
      reference ? await token(reference) : unauthorized();
    });
  }
};