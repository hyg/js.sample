var fs = require('fs');
var yaml = require('js-yaml');
var qiniu = require('qiniu');

var config = yaml.safeLoad(fs.readFileSync('dev.yaml', 'utf8'));
//var config = yaml.safeLoad(fs.readFileSync('release.yaml', 'utf8'));

qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY ;
//console.log(qiniu);

var token = uptoken("test");
console.log(token);
var ret =uploadFile("C:\\Users\\huangyg\\Desktop\\phd\\phd.ref\\我国中老年人劳动供给特征研究.pdf","test1",token)
console.log(ret);

function uptoken(bucketname) {
  var putPolicy = new qiniu.rs.PutPolicy(bucketname);
  //putPolicy.callbackUrl = callbackUrl;
  //putPolicy.callbackBody = callbackBody;
  //putPolicy.returnUrl = returnUrl;
  //putPolicy.returnBody = returnBody;
  //putPolicy.asyncOps = asyncOps;
  //putPolicy.expires = expires;

  return putPolicy.token();
}

function uploadFile(localFile, key, uptoken) {
  var extra = new qiniu.io.PutExtra();
  //extra.params = params;
  //extra.mimeType = mimeType;
  //extra.crc32 = crc32;
  //extra.checkCrc = checkCrc;

  qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
    if(!err) {
      // 上传成功， 处理返回值
      console.log(ret.key, ret.hash);
      // ret.key & ret.hash
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
      // http://developer.qiniu.com/docs/v6/api/reference/codes.html
    }
  });
}