var fs = require('fs');
var yaml = require('js-yaml');
var html2json = require('html2json').html2json;

const args = process.argv.slice(2);
const htmlfilename = args[0];
const json = html2json(fs.readFileSync(htmlfilename, 'utf8'));

const NRVpath = "../../raw/food/NRV.202410a.yaml";
const DRIspath = "../../raw/food/DRIs.DRIforChina2023.yaml";

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

//console.log("%o",json);

const tbody = findtable(json);
var elementdata = parseeshian(tbody);
makefoodyaml(elementdata);

function findtable(node){
    if(node.tag=="tbody"){
        return node;
    }else{
        for(var i in node.child){
            var ret = findtable(node.child[i]);
            if(ret != null){
                return ret;
            }
        }
    }
    return null;
}

function parseeshian(node) {
    //console.log("enter parseeshian:\n%s",table[0].tbody);
    var data = new Object();
    var key, value;

    for (var i in node.child) {
        if(node.child[i].tag == "tr"){
            for(var j in node.child[i].child){
                var item = node.child[i].child[j];
                if(item.tag == "th"){
                    //log("th:%o",item.child);
                    key = item.child[0].text;
                }
                if(item.tag == "td"){
                    //log("td:%o",item.child);
                    if(item.child != null){
                        value = item.child[0].text;
                        data[key] = value;
                    }
                }
            }
        }
    }
    //log("resule: %o",data);
    return data;
}


//gojson(json);
function gojson(node){
    log("%o",node);
    for(var i in node.child){
        gojson(node.child[i]);
    }
}

function loadDRIs() {
    var NRV = yaml.load(fs.readFileSync(NRVpath, 'utf8'));
    var DRIs = yaml.load(fs.readFileSync(DRIspath, 'utf8'));

    // put NRV data into DRIs
    for (var element in NRV.element) {
        if (DRIs.element[element].unit == NRV.element[element].unit) {
            DRIs.element[element].RNI = NRV.element[element].amount;
        } else {
            log("unit different between NRV and DRIs: " + element);
        }
    }

    return DRIs;
}

function makefoodyaml(data){
    const DRIs = loadDRIs();
    log("DRIs:\n%s",DRIs);

    var food = new Object();
    const foodfilename = "e."+ data["食品中文名"] + ".yaml";
    
    food.name = data["食品中文名"];
    food.amount = 100;
    food.unit = 'g';
    
    var foodelement = new Object();
    const datamap = {
        "能量(千卡)": {key: "热量",unit:"kcal"},
        "蛋白质(克)": {key:"蛋白质",unit:"g"},
        "脂肪(克)":{key:"脂肪",unit:"g"},
        "碳水化合物(克)":{key:"碳水化合物",unit:"g"},
        "膳食纤维(克)":{key:"膳食纤维",unit:"g"},
        "维生素A(微克视黄醇当量)":{key:"VA(视黄醇等)",unit:"μg"},
        "维生素E(毫克α-生育酚当量)":{key:"VE(生育酚)",unit:"mg"},
        "维生素B1（硫胺素）(毫克)":{key:"VB1(硫胺素)",unit:"mg"},
        "维生素B2（核黄素）(毫克)":{key:"VB2(核黄素)",unit:"mg"},
        "烟酸（烟酰胺）(毫克)":{key:"VB3(烟酸)",unit:"mg"},
        "泛酸(毫克)":{key:"VB5(泛酸)",unit:"mg"},
        "维生素B6(毫克)":{key:"VB6(吡哆素)",unit:"mg"},
        "叶酸(微克叶酸当量)":{key:"VB9(叶酸)",unit:"μg"},
        "维生素B12(微克)":{key:"VB12(钴胺素)",unit:"μg"},
        "维生素C（抗坏血酸）(毫克)":{key:"VC(抗坏血酸)",unit:"mg"},
        "维生素D(微克)":{key:"VD3(胆钙化醇)",unit:"μg"},
        "维生素K(微克)":{key:"VK(凝血维生素)",unit:"μg"},        
        "磷(毫克)":{key:"磷",unit:"mg"},
        "钙(毫克)":{key:"钙",unit:"mg"},
        "铁(毫克)":{key:"铁",unit:"mg"},
        "钠(毫克)":{key:"钠",unit:"mg"},
        "钾(毫克)":{key:"钾",unit:"mg"},
        "镁(毫克)":{key:"镁",unit:"mg"},
        "锌(毫克)":{key:"锌",unit:"mg"},
        "碘(微克)":{key:"碘",unit:"μg"},
        "硒(微克)":{key:"硒",unit:"μg"},
        "铜(毫克)":{key:"铜",unit:"mg"},
        "氟(毫克)":{key:"氟",unit:"mg"},
        "锰(毫克)":{key:"锰",unit:"mg"},
        "生物素(微克)":{key:"生物素",unit:"μg"},
        "胆碱(毫克)":{key:"胆碱",unit:"mg"}
    };

    for(var name in datamap){
        //log("name:",name);
        if((data[name] != null)&(data[name]!= "-")){
            //log("datamap[%s]:",name,datamap[name]);
            //log("datamap[%s].unit:",name,datamap[name].unit);
            //log("DRIs.element[datamap[%s].key]:",name,DRIs.element[datamap[name].key]);
            //log("DRIs.element[datamap[%s].key].unit:",name,DRIs.element[datamap[name].key].unit);
            if(datamap[name].unit == DRIs.element[datamap[name].key].unit){
                var DRIvalue = 0;
                if((DRIs.element[datamap[name].key].RNI != null)&(DRIs.element[datamap[name].key].RNI != "")){
                    DRIvalue = DRIs.element[datamap[name].key].RNI;
                }else if((DRIs.element[datamap[name].key].EAR != null)&(DRIs.element[datamap[name].key].EAR != "")){
                    DRIvalue = DRIs.element[datamap[name].key].EAR;
                }else if((DRIs.element[datamap[name].key].AI != null)&(DRIs.element[datamap[name].key].AI != "")){
                    DRIvalue = DRIs.element[datamap[name].key].AI;
                }else if((DRIs.element[datamap[name].key].PI_NCD != null)&(DRIs.element[datamap[name].key].PI_NCD != "")){
                    DRIvalue = DRIs.element[datamap[name].key].PI_NCD;
                }else if((DRIs.element[datamap[name].key].SPL != null)&(DRIs.element[datamap[name].key].SPL != "")){
                    DRIvalue = DRIs.element[datamap[name].key].SPL;
                }else if((DRIs.element[datamap[name].key].UL != null)&(DRIs.element[datamap[name].key].UL != "")){
                    DRIvalue = DRIs.element[datamap[name].key].UL;
                }

                var item = new Object()
                item.amount = Number(data[name]);
                item.unit = datamap[name].unit;
                if(DRIvalue == 0){
                    item.nrv = 0;
                }else{
                    item.nrv = Number((data[name]/DRIvalue*100).toFixed(2));
                }

                foodelement[datamap[name].key] = item ;

            }else{
                log("unit different %s: %s vs %s",name,datamap[name].unit, DRIs.element[datamap[name].key].unit)
            }
        }
    }

    food.element = foodelement;
    fs.writeFileSync(foodfilename, yaml.dump(food));
    log("save food: %s\n%s",foodfilename,yaml.dump(food));

}