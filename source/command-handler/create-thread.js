const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../script.js');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-thread-logging')
    .setDescription('Performs an in-game player action.')
    .addStringOption(option => option.setName('service').setDescription('Selected action will be performed on given tag.').setRequired(true)),

  async execute(interaction) {
    // Work in progress...
  }
};