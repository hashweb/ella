const config = require('config');
const request = require('request');
const moment = require('moment');
const logger = require('./logger');

// bit hacky for now, but keep reference to the bot
let bot = null;

/**
 * Performs a search on the Hashweb API
 * @param {string} query - The search query provided.
 * @returns {Promise} - the result wrapped in a promise
 */
function getUserObject(user) {
  let options = {
    url: `${config.get('hashwebApi.url')}/stats/users/${user}`
  }

  let promise = new Promise((resolve, reject) => {
    // Don't bother searching if switched off in config
    if (config.get('hashwebApi.status') === false) {
      reject(new Error('hashweb API cannot be used as Hashweb feature switched off'));
      return
    }

    request(options, (err, res, body) => {
      if (err) {
        reject(err);
      }

      if (res.statusCode === 404) {
        reject(new Error('User not found'));
      }

      // Check for potential parse error, such as google returning HTML instead of JSON
      try {
        body = JSON.parse(body);
      } catch(e) {
        reject(e);
      }

      resolve(body)
    })
  });

  return promise;
}

/**
 * Checks when a user was last seen
 * @param {string} userName - The search query provided.
 * @returns {Promise} - the result wrapped in a promise
 */
function seen(user) {
  let promise = new Promise((resolve, reject) => {
    getUserObject(user).then(res => {
      let fromNow = moment(res.lastSeen.timeStamp).fromNow();
      resolve(`${res.username} was last seen ${fromNow} <${res.username}> ${res.lastSeen.message}`);
    }, err => {
      reject(err)
    })
  })

  return promise;
}

/**
 * Checks when a user was first seen
 * @param {string} userName - The search query provided.
 * @returns {Promise} - the result wrapped in a promise
 */
function fseen(user) {
  let promise = new Promise((resolve, reject) => {
    getUserObject(user).then(res => {
      let fromNow = moment(res.firstSeen.timestamp).fromNow();
      resolve(`${res.username} was first seen ${fromNow} <${res.username}> ${res.firstSeen.message}`);
    }, err => {
      reject(err);
    })
  })

  return promise;
}

function getBans(bt) {
    bot = bt;
    request(`${config.get('hashwebApi.url')}/stats/bans`, function(error, response, body) {
        try {
            var body = JSON.parse(body);
        } catch(e) {
            console.log('Failed to parse bans list')
        }
        processBans(body);
    })
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
        if (typeof ban_length === "number") {
            timestamp.add(ban_length, 'hours');
            if (timestamp.isBefore(now)) {
                unBan(item);
            }

            else if (timestamp.isBefore(now.add(1, 'day'))) {
                that.unBanTomorrowMsg(item.user);
            }

            continue;
        }

        // Fallback to unban date if no hours set
        if (unban_date) {
            unban_date = moment(unban_date);
            if (unban_date.isBefore(now)) {
                unBan(item);
            }

            else if (unban_date.isBefore(now.add(1, 'day'))) {
                that.unBanTomorrowMsg(item.user);
            }

            continue;
        }

        // If neither a date has been set or a set of hours, unban aftrr 24 hours
        var duration = moment.duration(now.diff(timestamp));
        // Need to add closure here
        if (parseInt(duration.asHours()) >= 24) {
            (function(item) {
                setTimeout(function() {
                    that.unBan(item);
                    // this is causing a flood and Freenode Kick's ella of the server, so try to throttle the amount of unbans
                }, 20000 * counter);
            })(item);
        }
        counter++;

    }
    this.banTomorrowFlag = true;
}


function unBan(item) {
    var that = this;
    this.context.client.get_user('ChanServ').send('op #web');
        // Chanserv can take some time to react to op Ella up, so we need a delay before trying any op commands
        setTimeout(function() {
            that.context.client.get_channel('#web').client.raw('MODE ' + '#web' + ' -b ' + item.banmask);
            that.context.client.get_user('ChanServ').send('deop #web');
            // Ella may or may not be in #web-ops
            if (that.context.client.get_channel('#web-ops')) {
                that.unBanMsg(item);
            }
        }, 3000);
}

module.exports = {
  seen,
  fseen
}
