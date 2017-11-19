const hashweb = require('./hashweb');
const config = require('config');
const request = require('request');

class Karma {

  getUsersKarma(user) {
    let promise = new Promise((resolve, reject) => {
      hashweb.getUserObject(user).then(obj => {
        resolve(obj.karma);
      }, err => {
        reject(err);
      })
    });

    return promise;
  }


  giveKarma(user) {

  }
}

module.exports = Karma;
