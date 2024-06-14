const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const { exec } = require('node:child_process');


const log = s => console.log(s);

const add = exec('git add .');

let sha = git.commit({
    fs,
    dir: '.',
    author: {
        name: 'huang yonggang',
        email: 'huangyg@mars22.com',
    },
    message: 'git in nodejs sample\n will be used in day over operations.\njuse test for now.'
});
log(sha);
