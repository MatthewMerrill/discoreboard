const commando = require('discord.js-commando');
const datastore = require('../../datastore');

module.exports = class ScrapeCommand extends commando.Command {

  constructor(client) {
    super(client, {
      name: 'scrape',
      aliases: [],
      group: 'scoreboard',
      memberName: 'scrape',
      description: 'Parse through the logs',
      examples: ['scrape here', 'scrape all'],
      args: [
        {
          key: 'where',
          label: '"where"',
          default: 'here',
          oneOf: ['here', 'all', 'everywhere'],
          prompt: 'scrape in this channel (here) or in all channels (all)',
          type: 'string',
          infinite: false,
        }
      ]
    });
  }

  async run(msg, args) {
    if (args.where === 'here') {
      msg.reply('I will look around here');
      this.scrapeChannel(msg.channel, () => {
        msg.reply('Done!');
      });
    }
    else {
      msg.reply('I will look around all over the guild...');
      let channels = msg.guild.channels.array();
      let promises = [];
      let numDone = 0
      let numToDo = 0;
      let progMsg = undefined;
      console.log('looks like', channels.length, 'to do');
      for (let channel of channels.values()) {
        if (channel.type === 'text') {
          numToDo += 1;
          promises.push((async () => {
            try {
              await new Promise((resolve, reject) => {
                this.scrapeChannel(channel, resolve, reject)
              });
            } catch (err) {
              msg.reply(`Error Scraping #${channel.name}: ${err}`);
            } finally {
              numDone += 1;
              let prog = `Done Scraping #${channel.name} ${numDone}/${numToDo}`;
              if (progMsg) {
                progMsg.edit(prog);
              }
              else {
                progMsg = await msg.channel.send(prog);
              }
            }
          })());
        }
      }
      try {
        await Promise.all(promises);
        msg.reply(`Phew! Done scraping the guild (${numDone} channels).`);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async scrapeChannel(channel, resolve, reject) {
    function fetchBatch(before) {
      channel.fetchMessages({ limit: 100, before: before })
        .then(processBatch)
        .catch(reject);
    }

    async function processMessage(msg) {
      try {
        for (let reaction of msg.reactions.values()) {
          // TODO: support more than 100?
          let users = await reaction.fetchUsers(100);
          for (let user of users.values()) {
            datastore.reactionAdded(
              channel.guild.id,
              channel.id,
              msg.id,
              user.id,
              msg.member.id,
              reaction.emoji.identifier)
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function processBatch(batch) {
      let batchOps = batch.map(processMessage);
      //await Promise.all(batchOps);
      let first = batch.firstKey();
      if (first !== undefined) {
        fetchBatch(first);
      }
      else if (resolve) {
        resolve();
      }
    }

    datastore.wipeChannel();
    fetchBatch();
  }

}


