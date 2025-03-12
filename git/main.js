const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const { exec } = require('node:child_process');


const log = s => console.log(s);

const add = exec('git add .');
dayover();

async function dayover(){

    let sha = await git.commit({
        fs,
        dir: "D:\\huangyg\\git\\raw",
        author: {
            name: 'huang yonggang',
            email: 'huangyg@mars22.com',
        },
        message: 'git in nodejs sample\n will be used in day over operations.\njuse test for now.'
    });
    log(sha);
    
    let pushResult = await git.push({
        fs,
        http,
        dir: "D:\\huangyg\\git\\raw",
        remote: 'all',
        ref: 'master',
        onAuth: () => ({ username: process.env.GITHUB_TOKEN }),
      })
      console.log(pushResult)
}