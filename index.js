const IRC = require('irc-framework');
const config = require('config');

let bot = new IRC.Client();

bot.connect({
  host: config.get('irc.host'),
  nick: config.get('irc.nick')
})

bot.on('registered', function() {
  console.log('Connected!');
  bot.join('#web-testing');
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
      }
    }
});

/**
 * Return a pong.
 * @param {object} event - IRC.
 * @return {string} The blended color.
 */
function ping(event) {
  event.reply(`${event.nick} Pong`);
}
