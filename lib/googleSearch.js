const config = require('config');
const request = require('request');

/**
 * Performs a Google search.
 * @param {string} query - The search query provided.
 * @returns {Promise} - the result wrapped in a promise
 */
function googleSearch(q) {
  let options = {
    url: config.get('googleSearch.url'),
    qs: {
      cx: config.get('googleSearch.cx'),
      key: config.get('googleSearch.key'),
      q: q
    }
  }

  let promise = new Promise((resolve, reject) => {
    // Don't bother searching if switched off in config
    if (config.get('googleSearch.status') === false) {
      reject(new Error('Search attempted but Google Search Feature switched off'));
      return
    }

    request(options, (err, res, body) => {
      if (err) {
        reject(err);
      }

      // Check for potential parse error, such as google returning HTML instead of JSON
      try {
        body = JSON.parse(body);
      } catch(e) {
        reject(e);
      }

      // Check for item length
      if (body.items.length < 1) {
        reject(new Error('no items'));
        return
      }

      resolve(body.items[0])
    })
  });

  return promise;
}

module.exports = googleSearch;
