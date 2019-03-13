class JSONDataStore {

  constructor(fileName) {
    const lowdb = require('lowdb');
    const FileSync = require('lowdb/adapters/FileSync');
    this.db = lowdb(new FileSync(fileName || 'db.json'));
    this.db.defaults({
      guilds: {},
    }).write();
  }
  
  getGuild(guild) {
    return this.db.get('guilds').defaults({
      [guild]: {}
    });
  }

  reactionAdded(guild, channel, message, sender, target, reaction) {
    if (guild && sender && target && reaction) {
      this.getGuild(guild)
        .update([channel, reaction, sender, target], n => (n || 0) + 1)
        .write();
    }
    else {
      console.log('idk what you\'re trying to say here', arguments);
    } 
  }

  wipeChannel(channel) {
    this.getGuild(guild).unset(channel).write();
  }

  close() {
    this.db.write();
  }
}

class SqliteDataStore {
  
  constructor(fileName) {
    const sqlite3 = require('sqlite3').verbose();
    this.db = new sqlite3.Database(fileName);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS reactions (
        guild   TEXT NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        sender  TEXT NOT NULL,
        target  TEXT NOT NULL,
        emoji   TEXT NOT NULL,
        UNIQUE (guild, channel, message, sender, target, emoji)
      )
      `);
    this.db.run(`
      CREATE VIEW IF NOT EXISTS emojis_by_channel (
        guild, channel, emoji, count
      )
      AS
        SELECT
          guild,
          channel,
          emoji,
          count(*)
        FROM reactions
        GROUP BY guild, channel, emoji
      `);
  }

  reactionAdded(guild, channel, message, sender, target, emoji) {
    if (guild && channel && message && sender && target && emoji) {
      this.db.run(`
        INSERT OR IGNORE INTO reactions
          (guild, channel, message, sender, target, emoji)
        VALUES
          (?,     ?,       ?,       ?,      ?,      ?)
        `, [guild, channel, message, sender, target, emoji]);
    }
    else {
      throw new Error('missing arguments');
    }
  }

  wipeChannel(channel) {
    
  }

  close() {
    this.db.close();
  }

}

module.exports = new SqliteDataStore('./db.sqlite');

