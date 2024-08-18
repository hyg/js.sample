//var {B,log} = require("./A");
import {A} from "./A.js";
import {B} from "./B.js";
import {C,log} from "./C.js";

//var data = new C("D:\\huangyg\\git\\raw\\food\\d.20240818.yaml");
var obj = C("D:\\huangyg\\git\\raw\\food\\d.20240818.yaml");
//console.log("data:\n",data.tostring());
//log("data:\n",data.tostring());
//console.log("data:\n",obj.tostring(obj.fooddata));
//log("data:\n",obj.tostring(obj.fooddata));
log("data:\n%o",obj.fooddata);