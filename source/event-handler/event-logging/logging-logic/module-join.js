const { EmbedBuilder } = require('discord.js');

const joinExtractionLogic = async (reference, service, response, client) => {
  const regex = /^(\d{4}\.\d{2}\.\d{2}_\d{2}\.\d{2}\.\d{2}): (.+?) ID (\d+) (left|joined) this ARK!/gm;

  try {
    let counter = 0;
    let result = '', output = '';
    while ((result = regex.exec(response)) !== null && counter <= 10) {
      const [string, date, gamertag, identifier, condition] = result;
      const [datePart, timePart] = date.split('_');
      const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
      const unix = Math.floor(new Date(dateTimeString).getTime() / 1000);

      switch (condition) {
        case 'joined':
          output += `<t:${unix}:f>\n**Player Identity Information**\n[${gamertag}]: (${identifier}) joined your server!\n\n`;
          counter++;
          break;
        case 'left':
          output += `<t:${unix}:f>\n**Player Identity Information**\n[${gamertag}]: (${identifier}) left your server!\n\n`;
          counter++;
          break;

        default:
          break;
      };
    };

    Object.entries(reference.join).forEach(async entry => {
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

module.exports = { joinExtractionLogic };