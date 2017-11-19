const config = require('config');
const request = require('request');
const moment = require('moment');
const logger = require('./logger');

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

/**
 * Get stats off a user
 * @param {string} userName - The search query provided.
 * @returns {Promise} - the result wrapped in a promise
 */
function stats(user) {
  let promise = new Promise((resolve, reject) => {
    getUserObject(user).then(res => {
      let fromNow = moment(res.firstSeen.timestamp).fromNow();
      resolve(`${res.username} has been a user here since ${fromNow}, wrote ${res.messageCount} messages and holds ${res.karma} karma points`);
    }, err => {
      reject(err)
    })
  })

  return promise;
}

module.exports = {
  seen,
  stats,
  fseen,
  getUserObject
}
