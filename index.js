const IRC = require('irc-framework');
const config = require('config');
const request = require('request');
const package = require('./package.json');

// Lib Modules
const logger = require('./lib/logger');
const hashweb = require('./lib/hashweb');
const googleSearch = require('./lib/googleSearch');

let bot = new IRC.Client();

bot.connect({
  host: config.get('irc.host'),
  nick: config.get('irc.nick')
})

bot.on('registered', function() {
  bot.join('#web-testing');
  hashweb.checkBans(bot);
});

bot.on('message', function(event) {
    // if the first character is a !, lets jump into command mode
    if (event.message.indexOf('!') === 0) {
      let command = event.message.toLowerCase().replace('!', '').split(' ');
      // Go through available options
      switch(command[0]) {
        case 'ping':
          ping(event);
          break;
        case 'lucky':
          // concatenate the remaining search terms into a single string
          let query = command.splice(1).join(' ');
          searchGoogle(query, event);
          break;
        case 'seen':
          seen(command[1], event);
          break;
        case 'fseen':
          fseen(command[1], event);
          break;
        case 'help':
          help(event);
          break;
        case 'stats':
          stats(command[1], event);
          break;
      }
    }
});

bot.on('privmsg', function(event) {
  let text = event.message;
  let channel = text.match(/^(\#[a-zA-Z0-9-]+)/);
  let adminUsers = config.get('adminUsers');
  for (var i=0;i < adminUsers.length ; i++) {
      /* Check the config if its a valid user */
      if (adminUsers[i].host === event.hostname && channel) {
          let chanObj = bot.channel(channel);
          text = text.replace(/^(\#[a-zA-Z0-9-]+) /, "");
          chanObj.say(text.trim());

      }
  }
})

function stats(user, event) {

}

function help(event) {
  event.reply(`${event.nick} you can find out more about me here - ${package.repository.url}`);
}
/**
 * Return a pong.
 * @param {object} event - IRC.
 * @return {string} The blended color.
 */
function ping(event) {
  event.reply(`${event.nick} Pong`);
}

/**
 * Search Google and return the first result
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
function searchGoogle(cmd, event) {
   googleSearch(cmd).then((response) => {
    event.reply(`${event.nick}: ${response.title} - ${response.link}`);
   }, (err) => {
    logger.error(err.toString());
   })
}

/**
 * Check the last time a user has been seen
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
function seen(user, event) {
  hashweb.seen(user).then(res => {
    event.reply(`${event.nick}: ${res}`);
  }, err => {
    if (err.message === "User not found") {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
      return
    }
    logger.error(err);
  })
}

/**
 * Check the first time a user has been seen
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
function fseen(user, event) {
  hashweb.fseen(user).then(res => {
    event.reply(`${event.nick}: ${res}`);
  }, err => {
    if (err.message === "User not found") {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
      return
    }
    logger.error(err);
  })
}
