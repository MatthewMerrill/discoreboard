# discoreboard

## What can it do?

1. Have the bot scrape your server's history with `scoreboard scrape here` (current channel) or `scoreboard scrape everywhere` (all channels). At some point, there might be a limit on how far back the bot will search.
2. See stats:
  - `scoreboard emojis`: See what emojis are most often used in reactions 
  - `scoreboard received :100:` See who has received the most :100: reactions
  - `scoreboard sent :+1:` See who has sent the most :+1: reactions


## What information does the bot store?
To track usage stats, the bot has a database containing a giant table of:

- Guild ID
- Channel ID
- Message ID
- User IDs (sender and target)
- Reaction Identifier

It does *not* contain any message content information, and the identifiers are just large numbers (not emails or anything).
