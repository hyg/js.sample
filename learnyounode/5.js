var fs = require('fs');

console.log(process.argv)

fs.readdir(process.argv[2],function callback(err, list) {
  if (err) throw err;
  
  for (var i = 0;i<list.length;i++){
	
	if (list[i].substr(list[i].indexOf('.')+1).toLowerCase()==process.argv[3]){
		console.log(list[i].toString())
	}
  }
  
});

//node 5.js C:/Users/huangyg/Desktop pdf