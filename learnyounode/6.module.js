var fs = require('fs');

module.exports = function walk(dir,extension,callback) {
	fs.readdir(dir,function (err, list) {
	  /*if (err) throw err;*/
	  
	  for (var i = 0;i<list.length;i++){
		if (list[i].substr(list[i].indexOf('.')+1).toLowerCase()==extension){
			callback(err,list[i].toString())
		}
	  }
	});
}