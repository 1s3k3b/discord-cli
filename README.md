## Usage
- Download or clone the repo
- `npm install . -g`
- `dcli`

## Commands
`login <token>`<br>
Logs in a client using a bot token

`logout`<br>
Logs out of a client

`info`<br>
Shows info about the currently logged in client, and the guild&channel if there are current ones

`guild <id|name>`<br>
Changes guilds to the found one, either by name or by ID

`channel <id|name>`<br>
Changes channels to the found one in the current guild, which the bot will send messages to and recieve them from (must be in a guild to use!)

`send <content>`<br>
Sends a message to the current channel (must be in a channel to use!)

`sendFile <path>`<br>
Sends a file's contents to the current channel (must be in a channel to use!)

`sendHaste <url>`<br>
Sends a haste's (hastebin.com & hasteb.in) contents to the current channel (must be in a channel to use!)

`clear`<br>
Clears the text history

`exit`<br>
Exits the process

`channels`<br>
Toggles showing channels on the left side
