const { EmbedBuilder } = require('discord.js');

const adminExtractionLogic = async (reference, service, response, client) => {
  const regex = /^(\d{4}\.\d{2}\.\d{2}_\d{2}\.\d{2}\.\d{2}): AdminCmd: (.+?) \((PlayerName: (.+?), ARKID: (\d+), SteamID: (.+?))\)$/gm
  try {
    let counter = 0;
    let result = '', output = '';
    while ((result = regex.exec(response)) !== null && counter <= 10) {
      const [string, date, command, , username, arkIdentifier, steamIdentifier] = result;
      const [datePart, timePart] = date.split('_');
      const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
      const unix = Math.floor(new Date(dateTimeString).getTime() / 1000);

      output += `<t:${unix}:f>\n**Admin Identity Information**\n[${steamIdentifier}]\n${username}: ${command}\n\n`;
      counter++;
    };

    Object.entries(reference.admin).forEach(async entry => {
      if (parseInt(entry[0]) === service.id) {
        try {
          const channel = await client.channels.fetch(entry[1]);
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setFooter({ text: `Tip: Contact support if there are issues.` })
            .setDescription(`${output}`);

          await channel.send({ embeds: [embed] });
        } catch (error) {
          if (error.code === 10003) { null };
        };
      };
    });
  } catch (error) { null };
};

module.exports = { adminExtractionLogic };