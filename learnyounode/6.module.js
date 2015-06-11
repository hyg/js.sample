var fs = require('fs');
var path = require('path');

module.exports = function walk(dir,extension,callback) {
	fs.readdir(dir,function (err, list) {
	  if (err) {
		  callback(err);
		  return;
	  };
	  
	  var rlist = new Array();
	  for (var i = 0;i<list.length;i++){
		if (path.extname(list[i]) === '.' + extension){
			rlist.push(list[i]);
		}
	  }
	  callback(null,rlist)
	});
}