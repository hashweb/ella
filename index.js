const IRC = require('irc-framework');
const config = require('config');
const request = require('request');
const package = require('./package.json');
const cheerio = require('cheerio');
const {VM} = require('vm2');

// Lib Modules
const Karma = require('./lib/karma');
const logger = require('./lib/logger');
const hashweb = require('./lib/hashweb');
const googleSearch = require('./lib/googleSearch');

let karma = new Karma();
let bot = new IRC.Client();

bot.connect({
  host: config.get('irc.host'),
  nick: config.get('irc.nick'),
  username: config.get('irc.nick')
});

bot.on('connected', function() {
  console.log('Connected');
  bot.say('nickserv', 'identify ' + config.get('irc.user') + ' ' + config.get('irc.password'));

});

bot.on('registered', function() {
  console.log('Registered');
  bot.say('nickserv', 'identify ' + config.get('irc.user') + ' ' + config.get('irc.password'));
  setTimeout(function() {
        // there is a long delay between identifying and actually getting identified
        // #web won't let in without being identified
        let channels = config.get('irc.channels');
        channels.forEach(v => {
                bot.join(v);
        });
        bot.changeNick(config.get('irc.user'));
  }, 8000);
});

bot.on('raw', function(msg) {
        console.log(msg);
})

let urlRegex = new RegExp('^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?');

bot.on('message', function(event) {
  // if the first character is a !, lets jump into command mode
  if (event.message.indexOf('!') === 0) {
    let command = event.message.toLowerCase().replace('!', '').split(' ');
    // Go through available options
    switch(command[0]) {
    case 'ping':
      ping(event);
      break;
    case 'g': {
      // concatenate the remaining search terms into a single string
      let query = command.splice(1).join(' ');
      searchGoogle(query, event);
      break;
    }
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
    case 'ops':
      ops(event);
      break;
    case 'karma':
      giveKarma(command[1], event);
      break;
    case 'js': {
      let expr = command.splice(1).join(' ');
      js(expr, event);
    }
    }
  }
});

bot.on('debug', function(event) {
  logger.info(event);
})

//  Capture links being posted in the chat and show the titles
bot.on('message', function(event) {
  let msg = event.message;
  /* request only deals with urls which begin with http(s) */
  if (msg.match(urlRegex) && msg.match(/^http[s]?/)) {
    /* Make request to URl and get the title */
    var url = msg.match(urlRegex)[0];
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        var title = $('title').text().trim().replace(/\r?\n/, ' ');
        if (title) event.reply('Title: ' + title); // Don't bother showing a title if its empty
      }
    });

  }
});

bot.on('privmsg', function(event) {
  let text = event.message;
  let channel = text.match(/^(#[a-zA-Z0-9-]+)/);
  // for some reason public messages fall into privmsg too, so check for channel
  if (channel)
    channel = channel[0];
  else
    return;
  let adminUsers = config.get('adminUsers');
  for (var i=0;i < adminUsers.length ; i++) {
    /* Check the config if its a valid user */
    if (adminUsers[i].host === event.hostname && channel) {
      let chanObj = bot.channel(channel);
      text = text.replace(/^(#[a-zA-Z0-9-]+) /, '');
      chanObj.say(text.trim());
    }
  }
});

/**
 * Get Help on the bot!
 * @param {object} event - IRC.
 * @return {Promise}
 */
function help(event) {
  event.reply(`${event.nick} you can find out more about me here - ${package.repository.url}`);
}

/**
 * Return a pong.
 * @param {object} event - IRC.
 */
function ping(event) {
  event.reply(`${event.nick} Pong`);
}

/**
 * Call Ops.
 * @param {object} event - IRC.
 */
function ops(event) {
  let adminUsers = config.get('adminUsers');
  let users = ""
  adminUsers.forEach(v => {
    users += v.name + ' ';
  })

  event.reply(`${users}`);
}

function js(expression, event) {
  // A new VM needs to be created each time, otherwise variables/state will be left over from previous command
  const vm = new VM({
    timeout: 2000
  });
  try {
    // run expression inside a safe sandbox;
    let result = vm.run(expression);
    // result can sometimes be undefined if nothing was returned
    if (result) {
      event.reply(`${event.nick}: ${result}`);
    }
  } catch(e) {
    logger.error(e.message);
  }
}

/**
 * Give karma to another user.
 * @param {string} user
 * @param {object} event - IRC.
 * @return {Promise}
 */
async function giveKarma(user, event) {
  try {
    let response = await karma.giveKarma(event, user);
    event.reply(`${event.nick}: ${response}`);
  } catch(err) {
    logger.error(err);
  }
}

/**
 * Get stats on a user.
 * @param {string} user
 * @param {object} event - IRC.
 * @return {Promise}
 */
async function stats(user, event) {
  try {
    let res = await hashweb.stats(user);
    event.reply(`${event.nick}: ${res}`);
  } catch(err) {
    if (err.message === 'User not found') {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
      logger.error(err.message);
    }
  }
}

/**
 * Search Google and return the first result
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
async function searchGoogle(cmd, event) {
  try {
    let response = await googleSearch(cmd);
    event.reply(`${event.nick}: ${response.title} - ${response.link}`);
  } catch(err) {
    logger.error(err.toString())
  }
}

/**
 * Check the last time a user has been seen
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
async function seen(user, event) {
  try {
    let response = await hashweb.seen(user);
    event.reply(`${event.nick}: ${response}`);
  } catch(err) {
    if (err.message === 'User not found') {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
    }
    logger.error(err);
  }
}

/**
 * Check the first time a user has been seen
 * @param {string} search query - The query the user is searching for
 * @param {event} ircEevnt - The event object passed through
 */
async function fseen(user, event) {
  try {
    let response = await hashweb.fseen(user);
    event.reply(`${event.nick}: ${response}`);
  } catch(err) {
    if (err.message === 'User not found') {
      event.reply(`sorry ${event.nick}: I can't find that user :(`);
      return;
    }
    logger.error(err);
  }
}
