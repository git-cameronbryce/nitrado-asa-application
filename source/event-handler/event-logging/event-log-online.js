const { Events, EmbedBuilder } = require('discord.js');
const Rcon = require('rcon-client').Rcon;
const rateLimit = require('axios-rate-limit');
const { db } = require('../../script');
const axios = require('axios');
const ini = require('ini');


process.on('unhandledRejection', (error) => console.error(error));

const platforms = { arksa: true };
const api = rateLimit(axios.create(), { maxRequests: 1, perMilliseconds: 0250 });

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    async function loop() {

      const gameserver = async (reference, services) => {
        const extraction = async (reference, service, response) => {
          const regex = /(\w+),\s([\da-f]+)/gm;

          try {
            let counter = 0;
            let result = '', output = '';
            while ((result = regex.exec(response)) !== null && counter <= 50) {
              const [string, username, steamIdentifier] = result;
              output += `\`🟢\` \`Player Online\`\n\`🔗\` ${steamIdentifier}\n\`🔗\` ${username}\n\n`
              counter++;
            };

            Object.entries(reference.online).forEach(async entry => {
              if (parseInt(entry[0]) === service.id) {
                try {
                  const channel = await client.channels.fetch(entry[1].thread);
                  const message = await channel.messages.fetch(entry[1].message);

                  const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setFooter({ text: `Tip: Contact support if there are issues.` })
                    .setDescription(`${output.length > 1 ? `${output}Obelisk is watching for gameservers.\nScanned \`1\` of \`1\` updates.\n<t:${Math.floor(Date.now() / 1000)}:R>` : `**Additional Information**\nCurrently, there are zero players online.\n\nObelisk is monitoring for updates.\nScanned \`1\` of \`1\` gameservers.\n<t:${Math.floor(Date.now() / 1000)}:R>`}`);

                  await message.edit({ embeds: [embed] });
                } catch (error) { null };
              };
            });
          } catch (error) { null };
        };

        const parse = async (reference, service, iniData, rcon_port, ip) => {
          try {
            const password = iniData['ServerSettings']['ServerAdminPassword'];
            if (!password) { return };

            const info = { host: ip, port: rcon_port, password: password };
            const rcon = await Rcon.connect(info);

            rcon.authenticated ? console.log('Success') : console.log('Failure')
            const response = await Promise.all([rcon.send('listplayers')]);
            if (response) { await extraction(reference, service, response), await rcon.end() };

          } catch (error) { console.log('Authentication error.') };
        };

        const data = async (reference, service, rcon_port, ip, { url }) => {
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await parse(reference, service, ini.parse(response.data), rcon_port, ip) };
        };

        const path = async (reference, service, { service_id, rcon_port, ip, username }) => {
          const url = `https://api.nitrado.net/services/${service_id}/gameservers/file_server/download?file=/games/${username}/ftproot/arksa/ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini`;
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200) { await data(reference, service, rcon_port, ip, response.data.data.token) };
        };

        const tasks = services.map(async service => {
          const url = `https://api.nitrado.net/services/${service.id}/gameservers`;
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } });
          if (response.status === 200 && platforms[response.data.data.gameserver.game]) {
            await path(reference, service, response.data.data.gameserver)
          };
        });
        await Promise.all(tasks).then(() => console.log('Logging Finished:'))
      };

      const service = async (reference) => {
        try {
          const url = 'https://api.nitrado.net/services';
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } })
          if (response.status === 200) { gameserver(reference, response.data.data.services) };
        } catch (error) { console.log(error) }
      };

      const token = async (reference) => {
        try {
          const url = 'https://oauth.nitrado.net/token';
          const response = await api.get(url, { headers: { 'Authorization': reference.nitrado.token } })
          if (response.status === 200) { service(reference) };
        } catch (error) { console.log(error) };
      };

      const reference = await db.collection('asa-configuration').get();
      reference.forEach(doc => {
        doc.data() ? token(doc.data()) : console.log('Invalid document.');
      });
      setTimeout(loop, 120000);
    };
    loop().then(() => console.log('Loop started:'));
  },
};