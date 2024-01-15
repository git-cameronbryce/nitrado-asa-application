const Rcon = require('rcon-client').Rcon;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('player-lookup')
    .setDescription('Performs a database player lookup.')
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

      const invalidPlayer = async () => {
        const embed = new EmbedBuilder()
          .setColor('#e67e22')
          .setDescription(`**Game Command Failure**\nSelected player not located.\nBan information isn\'t stored.`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/PCD2pG4.png')

        return await interaction.followUp({ embeds: [embed] });
      }

      const validPlayer = async ({ admin, reason, unix }) => {
        const embed = new EmbedBuilder()
          .setColor('#2ecc71')
          .setDescription(`**Game Command Success**\nPlayer ban information located.\nLocal data will be shown.\n\nRemoved for ${reason}.\nID: ${admin}`)
          .setFooter({ text: 'Tip: Contact support if there are issues.' })
          .setThumbnail('https://i.imgur.com/CzGfRzv.png')

        playerFound = true;
        return await interaction.followUp({ embeds: [embed] });
      }

      playerFound = false
      const reference = (await db.collection('player-banned').doc(input.guild).get()).data();
      Object.entries(reference).forEach(async ([player, doc]) => {
        player === input.username ? validPlayer(doc) : null;
      });

      playerFound ? null : invalidPlayer();

    });
  }
};
