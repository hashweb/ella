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
    if (event.message.indexOf('hello') === 0) {
        console.log(event);
        event.reply('Hi!');
    }
});

bot.on('message', function(event) {
    if (event.message.indexOf('!') === 0) {
        console.log(event);
        event.reply('Hi!');
    }
});

