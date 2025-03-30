var Simplenote = require('simplenote-sync');

var simplenote = Simplenote({
  email : "huangyg@mars22.com",
  password : "auth.password",
  model : require('fs'),
  tag : '1'
});

setInterval(function() {
  simplenote.sync(function(err) {
    if(err) console.error(err);
  });
}, 60000);