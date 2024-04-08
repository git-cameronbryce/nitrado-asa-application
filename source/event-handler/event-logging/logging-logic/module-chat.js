const { EmbedBuilder } = require('discord.js');

const chatExtractionLogic = async (reference, service, response, client) => {
  const regex = /^(\d{4}\.\d{2}\.\d{2}_\d{2}\.\d{2}\.\d{2}): (.+?) \((.+?)\): (.+)$/gm;

  try {
    let counter = 0;
    let result = '', output = '';
    while ((result = regex.exec(response)) !== null && counter <= 10) {
      const [string, date, gamertag, username, message] = result;
      const [datePart, timePart] = date.split('_');
      const dateTimeString = `${datePart.replace(/\./g, '-')}T${timePart.replace(/\./g, ':')}`;
      const unix = Math.floor(new Date(dateTimeString).getTime() / 1000);

      output += `<t:${unix}:f>\n**Player Identity Information**\n[${gamertag}]: (${username})\n${message} \n\n`;
      counter++;
    };

    Object.entries(reference.chat).forEach(async entry => {
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

module.exports = { chatExtractionLogic };