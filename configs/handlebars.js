const hbs = require('express-handlebars');

const config  = hbs.create({
  defaultLayout: 'layout',
  helpers: {
    add: function (a, b) {
      return a + b;
    },
    isEqual: function (a, b, options) {
      return a === b ? options.fn(this) : options.inverse(this);
    }
  }
});

module.exports = config;