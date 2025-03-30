var gist = require('gist');

gist.create('your gist content', function (url) {
  console.log(url); //prints created gist url
});