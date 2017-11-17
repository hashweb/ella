Ella
========

About
------
Time has come for us to re-think what our bot of the future is going to look like and how it will suit our needs.
Natasha (who was once called Olga) has done a great job over the years but we wish to change the infrastructure and how people can contribute.

Natasha has stored a whole heap of information (I think from 2011 onwards, maybe earlier) but we want to move logs and stats to the main database we already have running.

Here are our reasons for building a new bot:

* We want to seperate data from the bot, we now have a hashweb API (currently being used by [Hashweb Stats](http://stats.hashweb.org).
* Leaving things like logs and statistics to the main database means we can let the bot to make API calls and data comes from the same place. This also means we can open it up to the public (as its not directly communicating with a database)
* Development on Natasha is quite slow, as she is closed off with only 1 person maintaining her.  We don't want a single point of entry.
* We fancied using a new platform, the old bot was wrote in Python (a fork of limnoria) and does a great job. But if users are going to contribute we want a low barrier to entry, and thus decided Node JS was the best solution for that.
* I want to learn Node JS....
* By Moving to Github means we aremore open and users can view and learn about how the new bot will work.

## Commands

There are currently no commands, this is a brand new bot

## Development
You will need Docker installed.
Docker is used to provide the correct environment, and the right environment variables. The operating system within Docker (Ubuntu 16 at the time of writing) and version of Node match the live environment where the bot will run.
* Once checked out you can run `make docker-sandbox` in the project folder.
* Then within the docker container run.
  * `yarn install`
  * `yan start`

