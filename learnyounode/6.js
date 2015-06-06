var module6 = require('./6.module')

module6(process.argv[2],process.argv[3],function callback(err, data){
	if (err) throw err;
	console.log(data.toString())
});

//node 6.js C:/Users/huangyg/Desktop pdf