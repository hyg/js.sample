const SimpleNote = require("SimpleNote");

var Note = SimpleNote("huangyg@mars22.com", "xxxxx")
Note.all(function(err, notes) {
  var keys = notes.select('blog').map('key');
  note.get(keys[0], function(err, note) {
    console.log(note.content);
  })
});