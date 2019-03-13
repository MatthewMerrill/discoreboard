const Discord = require('discord.js');
const commando = require('discord.js-commando');
const path = require('path');

const datastore = require('./datastore');

if (process.env.DISCORD_TOKEN) {
  const client = new commando.Client({
    commandPrefix: 'scoreboard',
  });

  client
    .on('error', console.error)
    .on('warn', console.warn)
    .on('debug', console.debug)
    .on('ready', () => console.log(`Logged in as ${client.user.tag}!`))
    .on('disconnected', () => console.warn('Disconnected'))
    .on('reconnecting', () => console.warn('Reconnecting...'))
    .on('messageReactionAdd', (msg, usr) => {
      datastore.reactionAdded(
        msg.message.guild.id,
        msg.message.channel.id,
        msg.message.id,
        usr.id,
        msg.message.member.id,
        msg.emoji.identifier);
    })
    // https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md
    // make sure we hear ALL reactions
    .on('raw', packet => {
      // We don't want this to run on unrelated packets
      if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
      // Grab the channel to check the message from
      const channel = client.channels.get(packet.d.channel_id);
      // There's no need to emit if the message is cached, because the event will fire anyway for that
      if (channel.messages.has(packet.d.message_id)) return;
      // Since we have confirmed the message is not cached, let's fetch it
      channel.fetchMessage(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format, so we have to account for that case as well
        const emoji = packet.d.emoji.id
          ? `${packet.d.emoji.name}:${packet.d.emoji.id}`
          : packet.d.emoji.name;
        // This gives us the reaction we need to emit the event properly, in top of the message object
        const reaction = message.reactions.get(emoji);
        // Adds the currently reacting user to the reaction's users collection.
        if (reaction) reaction.users.set(packet.d.user_id, client.users.get(packet.d.user_id));
        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.emit('messageReactionAdd', reaction, client.users.get(packet.d.user_id));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.emit('messageReactionRemove', reaction, client.users.get(packet.d.user_id));
        }
      });
    });

  client.registry
    .registerGroup('scoreboard', 'Scoreboard')
    .registerDefaults()
    .registerCommandsIn(path.join(__dirname, 'commands'));

  client.login(process.env.DISCORD_TOKEN);
}
else {
  console.error('No DISCORD_TOKEN provided in env!');
}

