const Rcon = require('rcon-client').Rcon;
const { Events, Embed, EmbedBuilder } = require('discord.js');
const { db } = require('../script');
const axios = require('axios');

process.on('unhandledRejection', (error) => console.error(error));

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const set = new Set();

    async function loop() {
      const valid = async (admin, { rcon_port, ip, settings: { config: { 'current-admin-password': password } } }) => {
        const info = { host: ip, port: rcon_port, password: password };
        const rcon = await Rcon.connect(info);

        const response = await rcon.send('getchat');
        const regex = /AdminCmd: (\w+) \(PlayerName: (\w+), ARKID: (\d+), SteamID: (\w+)\)/g;
        const commands = [...response.matchAll(regex)].map(match => ({ command: match[1], name: match[2], ark: match[3], steam: match[4] }));

        let output = '';
        const channel = await client.channels.fetch(admin);
        commands.forEach(({ command, name, ark, steam }) => {
          console.log(`Command: ${command}, Player Name: ${name}, ARK ID: ${ark}, Steam ID: ${steam}`);
          output += `**Admin Command Retrieved**\n${steam}\n${name} ${ark}\n\`\`\`${command}\`\`\`\n`
          set.has(command) || (set.add(command));
        });

        try {
          const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setDescription(`${output}`)
            .setFooter({ text: 'Tip: Contact support if there are issues.' })

          await channel.send({ embeds: [embed] });
        } catch (error) { console.log('No embed to send.') }
      }

      const validDocument = async ({ nitrado, admin }) => {
        const url = 'https://api.nitrado.net/services';
        const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });

        response.data.data.services.forEach(async server => {
          const url = `https://api.nitrado.net/services/${server.id}/gameservers/`;
          const response = await axios.get(url, { headers: { 'Authorization': nitrado.token } });
          response.status === 200 ? valid(admin, response.data.data.gameserver) : console.log('Error')
        })
      }

      const reference = await db.collection('configuration').get();
      reference.forEach(doc => {
        doc.data() ? validDocument(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 15000);
    };
    // loop().then(() => console.log('Loop started:'));
  },
};
