const fs = require('fs');
const path = require('path');

const loadCommands = (client) => {
  const commandsPath = path.join(__dirname, '../command-handler');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  commandFiles.forEach(file => {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  });
};

module.exports = { loadCommands };
