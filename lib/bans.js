const moment = require('moment');
const request = require('request');
const config = require('config');
const logger = require('./logger');

// bit hacky for now, but keep reference to the bot
let bot = null;

function getBans(bt) {
  bot = bt;
  request(`${config.get('hashwebApi.url')}/stats/bans`, function(error, response, body) {
    try {
      body = JSON.parse(body);
    } catch(e) {
      logger.error('Failed to parse bans list');
    }
    processBans(body);
  });
  // Recall this function every 20 minutes
  setTimeout(getBans, 1200000);
}

function processBans(bansObj) {
  var now = moment();
  var counter = 0;
  for (var item of bansObj) {
    var ban_length = item.ban_length;
    var unban_date = item.unban_date;
    var timestamp = item.timestamp;
    timestamp = moment(timestamp);

    // First check ban_length, if that's empty fallback to date
    // ban_length should be in hours
    if (typeof ban_length === 'number') {
      timestamp.add(ban_length, 'hours');
      if (timestamp.isBefore(now)) {
        unBan(item);
      }

      continue;
    }

    // Fallback to unban date if no hours set
    if (unban_date) {
      unban_date = moment(unban_date);
      if (unban_date.isBefore(now)) {
        unBan(item);
      }

      continue;
    }

    // If neither a date has been set or a set of hours, unban aftrr 24 hours
    var duration = moment.duration(now.diff(timestamp));
    // Need to add closure here
    if (parseInt(duration.asHours()) >= 24) {
      (function(item) {
        setTimeout(function() {
          unBan(item);
          // this is causing a flood and Freenode Kick's ella of the server, so try to throttle the amount of unbans
        }, 20000 * counter);
      })(item);
    }
    counter++;

  }
}

function unBan(item) {
  bot.say('ChanServ', 'op #web');
  // Chanserv can take some time to react to op Ella up, so we need a delay before trying any op commands
  setTimeout(function() {
    bot.raw('MODE ' + '#web' + ' -b ' + item.banmask);
    bot.say('ChanServ', 'deop #web');

    unBanMsg(item);
  }, 3000);
}

function unBanMsg (item) {
  if (item.user) {
    bot.channel('#web-ops').say('I have unbanned ' + item.user + ' from #web');
  }
  else {
    bot.channel('#web-ops').say('I have unbanned ' + item.banmask + ' from #web');
  }
}

module.exports = {
  getBans
};
