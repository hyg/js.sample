const simpleGit = require('simple-git');
const GIT_SSH_COMMAND = 'C:/Progra~1/PuTTY/plink.exe';

async function status(workingDir) {
   let statusSummary = null;
   try {
      statusSummary = await simpleGit(workingDir).status();
   } catch (e) {
      // handle the error
   }
   return statusSummary;
}

// using the async function
//status("D:\\huangyg\\git\\raw").then((status) => console.log(status));

var commitmsg = `- 16:00~18:59	js: [js class](#20250321160000)`;
gitstep("D:\\huangyg\\git\\blog",commitmsg,"all",'master');
gitstep("D:\\huangyg\\git\\draft",commitmsg,"gitee",'master');
gitstep("D:\\huangyg\\git\\ego",commitmsg,"all",'vat');
gitstep("D:\\huangyg\\git\\js.sample",commitmsg,"all",'master');

async function gitstep(path,msg,remote,branch){
      let statusSummary = null;
   try {
      statusSummary = await simpleGit(path).status();
   } catch (e) {
      // handle the error
   }
   if(statusSummary.files.length){
      console.log("file changed:",statusSummary.files);
      simpleGit(path,{ config: ['core.autocrlf=false'] })
      .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
      .add('./*')
      .commit(msg)
      .push(remote, branch)
      .then((data) => {
         console.log('success:',path,"\n",data);
      })
      .catch((err) => {
          console.log(err);
      });
   }else{
      console.log("non file changed:",path);
   }
}

/* simpleGit("D:\\huangyg\\git\\raw")
   .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
   .add('./*')
   .commit('morning')
   .push('all', 'master')
   .then((data) => {
      console.log('raw success:',data);
   })
   .catch((err) => {
       console.log(err);
   });; */

/* simpleGit("D:\\huangyg\\git\\blog")
   .env('GIT_SSH_COMMAND', GIT_SSH_COMMAND)
   .add('./*')
   .commit(`- 10:00~13:59	js: [git sample](#20250312100000)
- 14:00~14:29	raw: [复习五元庄第四式](#20250312140000)
- 14:30~14:59	raw: [复习五元庄第五式](#20250312143000)
- 16:00~16:59	learn: [graphsync protocol](#20250312160000)`)
   .push('all', 'master')
   .then((data) => {
      console.log('blog success:',data);
   })
   .catch((err) => {
       console.log(err);
   });; */