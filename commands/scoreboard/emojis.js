const commando = require('discord.js-commando');

module.exports = class EmojisCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'emojis',
      aliases: ['top-emojis'],
      group: 'scoreboard',
      memberName: 'emojis',
      description: 'Most Used Emojis',
      examples: ['top-emojis'],
    });
  }

  async run(msg, args) {
    msg.reply('idk lol');
  }
}

