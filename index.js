const IRC = require('irc-framework');
const config = require('config');
const request = require('request');
const package = require('./package.json');
const cheerio = require('cheerio');

// Lib Modules
const Karma = require('./lib/karma');
const logger = require('./lib/logger');
const hashweb = require('./lib/hashweb');
const googleSearch = require('./lib/googleSearch');

let karma = new Karma();
let bot = new IRC.Client();

bot.connect({
  host: config.get('irc.host'),
  nick: config.get('irc.nick')
})

bot.on('registered', function() {
  console.log('Connected');
  bot.join('#web-testing');
});

let urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");

bot.on('message', function(event) {
    // if the first character is a !, lets jump into command mode
    if (event.message.indexOf('!') === 0) {
      let command = event.message.toLowerCase().replace('!', '').split(' ');
      // Go through available options
      switch(command[0]) {
        case 'ping':
          ping(event);
          break;
        case 'g':
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
        case 'karma':
          giveKarma(command[1], event);
          break;
      }
    }
});

//  Capture links being posted in the chat and show the titles
bot.on("message", function(event) {
  let msg = event.message;
  /* request only deals with urls which begin with http(s) */
  if (msg.match(urlRegex) && msg.match(/^http[s]?/)) {
    /* Make request to URl and get the title */
    var url = msg.match(urlRegex)[0];
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        var title = $("title").text().trim().replace(/\r?\n/, " ");
        if (title) event.reply("Title: " + title); // Don't bother showing a title if its empty
      }
    });

  };
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

function giveKarma(user, event) {
  karma.giveKarma(event, user).then(body => {
    console.log(body);
    event.reply(`${event.nick}: ${body}`);
  }, err => {
    logger.error(err);
  })
}

function stats(user, event) {
  hashweb.stats(user).then(res => {
    event.reply(`${event.nick}: ${res}`);
  }, err => {
    if (err.message === "User not found") {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
      return
    }
    logger.error(err);
  })
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
