var module6 = require('./6.module')

module6(process.argv[2],process.argv[3],function callback(err, data){
	if (err) throw err;
	
	for(var i=0;i<data.length;i++){
		console.log(data[i].toString())
	}
});

//node 6.js C:/Users/huangyg/Desktop pdf