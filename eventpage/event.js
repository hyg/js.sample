
//const pug = require('pug');
const fs = require('fs');

var time;
var eventqueue = new Object();

AddCOD("test");

function AddCOD(url){
	// read the source code from url
	// use test.js for develop
	
	// render the pug file
	var CODname = 'test';
	//const eventpyg = pug.compileFile('event.pug');
	//var eventhtml = eventpyg({COD: 'test'});
	
	//var eventhtml = pug.renderFile('event.pug', {COD: 'test'});
	var temp = fs.readFileSync("event.pug",'utf8') ;
	var eventhtml = temp.replace("{COD}",CODname) ;
	
	// write the COD event html file
	fs.writeFileSync(CODname+".event.html",eventhtml);
	
	// make the event listener 
}

function AddEvent(time,event){
	
}

function ProcessEvent(){
	
}