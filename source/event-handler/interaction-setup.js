const { ActionRowBuilder, Events, ModalBuilder, ChannelType, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.on(Events.InteractionCreate, async interaction => {

      try {
        if (interaction.customId === 'setup-token') {
          const modal = new ModalBuilder()
            .setCustomId('token-modal')
            .setTitle('Nitrado Token Verification');

          const row = new ActionRowBuilder()
            .addComponents(
              new TextInputBuilder()
                .setCustomId('token-option').setLabel('Required Nitrado Token').setMinLength(50).setMaxLength(150)
                .setPlaceholder('...oAg66TcQYUnYXBQn17A161-N86cN5jWDp7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            );

          modal.addComponents(row);
          await interaction.showModal(modal);
        }

        if (interaction.customId === 'token-modal') {
          const invalidToken = async () => {
            await interaction.reply({ content: 'Setup failure, ensure you follow provided steps above.', ephemeral: true });
          }

          const validToken = async ({ token }) => {
            const button = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setLabel('Base Version')
                  .setCustomId('base-version')
                  .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                  .setLabel('Upgraded Version')
                  .setCustomId('upgraded-version')
                  .setStyle(ButtonStyle.Secondary)
                  .setDisabled(true),
              );

            const embed = new EmbedBuilder()
              .setColor('#2ecc71')
              .setDescription(`**Token Creation & Overview**\n For those interested in upgrading to our more advanced tooling, the payment __must__ be done before installation, the base version is free.\n\n**Additional Information**\nSelect the upgrade button below for those who want our premium version. After the payment, press it again for a seamless transition.\n\n__Premium temporarily disabled.__ \n\n**[Partnership & Information](https://www.nitrado-aff.com/2M731JR/D42TT/ \"Nitrado Partner Link\")**\nConsider using our partnership link to purchase your personal servers to help fund our services!`)
              .setFooter({ text: 'Tip: Contact support if there are issues.' })
              .setImage('https://i.imgur.com/2ZIHUgx.png')

            await interaction.reply({ embeds: [embed], components: [button], ephemeral: true }).then(async () => {
              await db.collection('configuration').doc(interaction.guild.id)
                .set({ ['nitrado']: { token: token } }, { merge: true })
            })
          }

          try {
            const nitrado = { token: interaction.fields.getTextInputValue('token-option') };

            const url = 'https://oauth.nitrado.net/token';
            const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
            response.status === 200 && interaction.guild.features.includes('COMMUNITY')
              ? validToken(nitrado) : invalidToken()

          } catch (error) { invalidToken(), console.log(error.response.data.message) }
        }

        if (interaction.customId === 'base-version') {
          const installation = await interaction.reply({ content: 'Installation starting...', ephemeral: true })

          const roles = await interaction.guild.roles.fetch();
          const action = roles.map(async role => role.name === 'Obelisk Permission' ? await role.delete() : null);
          try { await Promise.all(action) } catch (error) { return await installation.edit({ content: 'In your settings, move the bot above the permission role.', ephemeral: true }) };

          await interaction.guild.roles.create({
            name: 'Obelisk Permission',
            color: '#2ecc71',
          }).then(() => console.log('Role created...'));

          const permissions = [{
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          }];

          const management = await interaction.guild.channels.create({
            name: `Obelisk Management`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          await interaction.guild.channels.create({
            name: '⚫│𝗕ot-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          const status = await interaction.guild.channels.create({
            name: '⚫│𝗦erver-𝗦tatus',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: management
          });

          const audits = await interaction.guild.channels.create({
            name: `Obelisk Audit Logging`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const remoteCommands = await interaction.guild.channels.create({
            name: '📄│𝗥emote-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const serverCommands = await interaction.guild.channels.create({
            name: '📄│𝗦erver-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const playerCommands = await interaction.guild.channels.create({
            name: '📄│𝗣layer-𝗖ommands',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: audits
          });

          const logging = await interaction.guild.channels.create({
            name: `Obelisk Game Logging`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const admin = await interaction.guild.channels.create({
            name: '📑│𝗔dmin-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          const chat = await interaction.guild.channels.create({
            name: '📑│𝗖hat-𝗟ogging',
            type: ChannelType.GuildForum,
            permissionOverwrites: permissions,
            parent: logging
          });

          const blueprinting = await interaction.guild.channels.create({
            name: `Obelisk Blueprinting`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: permissions
          });

          const remote = await interaction.guild.channels.create({
            name: '🔗│𝗥emote-𝗔ccess',
            type: ChannelType.GuildText,
            permissionOverwrites: permissions,
            parent: blueprinting
          });

          const button = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setLabel('Remote Access')
                .setCustomId('remote-access')
                .setStyle(ButtonStyle.Success),

              new ButtonBuilder()
                .setLabel('Item Lookup')
                .setCustomId('item-lookup')
                .setStyle(ButtonStyle.Secondary),
            );

          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription('**Remote Access Information**\nFor those interested in utilizing our remote access feature, make sure to follow the prompts and read carefully. Consider requesting support. \n\n**Remote Access Blueprinting **\nThere are two buttons: the first sends commands to the gameserver, and the second looks up item information for sending custom commands.')
            .setFooter({ text: 'Tip: Contact support if there are issues.' })
            .setImage('https://i.imgur.com/2ZIHUgx.png')

          await remote.send({ embeds: [embed], components: [button] })

          const message = await status.send({ content: 'test' });
          await db.collection('configuration').doc(interaction.guild.id)
            .set({
              ['audits']: { server: serverCommands.id, player: playerCommands.id, remote: remoteCommands.id },
              ['status']: { channel: status.id, message: message.id },
              ['logging']: { admin: admin.id, chat: chat.id }
            }, { merge: true });

          await installation.edit({ content: 'Installation finished...', ephemeral: true })
        }
      } catch (error) { console.log(error) };
    });
  },
};