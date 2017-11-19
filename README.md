Ella (beta)
========

About
------
This is a complete from-the-ground-up rework of Ella.
The previous one was causing issues, we've moved to irc-framework for this one, and so far the results are better.

## Commands

All commands begin with a `!`, e.g `!ping`

* `ping` - Ella will respond with a pong!
* `g [search Q] ` - Ella will do a google search based on this query
* `seen [user]` - Get the last time a user was seen
* `fseen [user]` - Get the first time a user was seen
* `stats [user]` - Get stats on a user
* `js [expression]` - Run JS in the sandbox and get results
* `karma [user]` - Give a karma point to a user (you can only use 1 per day)
* `ops` - Call the operators of the channel
* `help` - Find out more about Ella and her commands

### Op Commands
Ops can message Ella with [channel] [message] and she will send that message to that channel, e.g
`/msg ella #web Hello`

## Development
You will need Docker installed.
Docker is used to provide the correct environment, and the right environment variables. The operating system within Docker (Ubuntu 16 at the time of writing) and version of Node match the live environment where the bot will run.
* Once checked out you can run `make docker-sandbox` in the project folder.
* Then within the docker container run.
  * `yarn install`
  * `yan start`

