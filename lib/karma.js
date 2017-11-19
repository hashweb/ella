const hashweb = require('./hashweb');
const config = require('config');
const request = require('request');
const moment = require('moment');

/** Class representing a Karma within #web. */
class Karma {

  constructor() {
    // This should hold all our users who have given karma recently
    this.users = [];
    this.processKarma();
  }

  processKarma() {
    this.users.forEach((v, i) => {
      let timestamp = moment(v.time).add(1, 'days');
      // if enough time has elapsed, remove the row
      if (timestamp.diff(new Date()) > 0) {
        this.users.splice(i, 1);
      }
    })

    // re-run every 10 mins
    setTimeout(this.processKarma.bind(this), 600000);
  }

  getUsersKarma(user) {
    let promise = new Promise((resolve, reject) => {
      hashweb.getUserObject(user).then(obj => {
        resolve(obj.karma);
      }, err => {
        reject(err);
      });
    });

    return promise;
  }

  checkKarma(event) {
    let state = {
      status: true,
      time: null
    };

    this.users.forEach((v) => {
      if (v.nick === event.nick || v.hostname === event.hostname) {
        state.status = false;
        state.time = v.time;
      }
    });

    return state;
  }

  // Give Karma from one user to another
  giveKarma(event, userTo) {
    let options = {
      url: `${config.get('hashwebApi.url')}/stats/users/${userTo}/addkarma`,
      method: 'POST',
      form: {points: 1}
    };

    let promise = new Promise((resolve, reject) => {
      // First check if the user can give Karma
      if (!this.checkKarma(event).status) {
        let timeTo = moment(this.checkKarma(event).time).add(1, 'days').fromNow();
        resolve(`You have already given Karma, try again ${timeTo}`);
        return;
      }

      //  Users shouldn't be able to give themselves Karma
      if (event.nick.toLowerCase() === userTo.toLowerCase()) {
        resolve('You cannot give karma points to yourself');
      }

      // Make the request
      request(options, (err, res, body) => {
        if (err) {
          reject(err);
          return;
        }

        if (res.statusCode === 404) {
          reject(new Error('User not found'));
          return;
        }

        // Check for potential parse error, such as google returning HTML instead of JSON
        try {
          body = JSON.parse(body);
        } catch(e) {
          reject(e);
        }

        resolve(body.response);
        // Once the user has given karma, throttle karma usage by adding to a table
        this.users.push({
          nick: event.nick,
          hostname: event.hostname,
          time: new Date()
        });
      });
    });

    return promise;
  }
}

module.exports = Karma;
