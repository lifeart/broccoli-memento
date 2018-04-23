var express = require('express');
var app = express();

const fs = require('fs');
const path = require('path');
// const {link} = require('linkfs');
const mime = require('mime');
// const memfs = require('memfs');
// const mfs = memfs.fs;
var chokidar = require('chokidar');


// One-liner for current directory, ignores .dotfiles
var watcher = chokidar.watch([], {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
  console.log(event, path);
  if (event === 'change') {
    reloadFileToMemoryMap(path);
  }
});

const pathDiv = '/';

function tokenize(path) {
  return path.split(pathDiv);
}

const fsMap = {};

function isFile(tokenizedArray) {
  return !!tokenizedArray[tokenizedArray.length - 1].split('.')[1];
}

function toMap(tokenizedArray) {
  let isPath = !isFile(tokenizedArray);
  let result = tokenizedArray.reduse((pathPart, prevToken)=>{
    if (!pathPart[prevToken]) {
      pathPart[prevToken] = {};
    }
    return pathPart[prevToken];
  }, fsMap)
  if (!isPath) {
    result = true;
  }
}

const hash = new Map();
const alias = new Map();

const getFile = function(path) {
  if (alias.has(path)) {
    return getFile(alias.get(path));
  } else {
    if (hash.has(path)) {
      return hash.get(path);
    } else {
      if (fs.existsSync(path)) {
        return loadFileToMemoryMap(path);
      } else {
        return null;
      }
    }
  }
}
const addFileAlias = function(filePath, aliasPath) {
  alias.set(aliasPath, filePath);
}
const reloadFileToMemoryMap = function(fsPath) {
  console.log('reloadFileToMemoryMap');
  file = fs.readFileSync(fsPath, 'utf8');
  hash.set(fsPath,file);
}
const loadFileToMemoryMap = function(fsPath) {
  watcher.add(fsPath);
  file = fs.readFileSync(fsPath, 'utf8');
  addFileAlias(fsPath,fsPath + '-alias.'+ fsPath.split('.').pop());
  hash.set(fsPath,file);
  setInterval(function(path){
    hash.set(path,hash.get(path)+'--');
  }.bind(fsPath), 200);
  return file;
}

const dirLinks = [];

function createDirSymlink(src, dest) {
  dirLinks.push([src, dest]);
}

function resolvePath(token) {
  let symlinkResults = token.reduse((results, tokenPart)=>{
    return dirLinks.filter(([from, to])=>{
      return from.includes(tokenPart) || to.includes(tokenPart);
    });
  },[]);
  if (symlinkResults.length) {
    console.log('found', symlinkResults);
  }
}

// mfs.writeFileSync('/hello.txt', 'World!');
// mfs.readFileSync('/hello.txt', 'utf8'); // World!

// mfs.writeFileSync('/foo', 'bar');
// const lfs = link(mfs, ['/foo2', '/foo']);
// console.log(lfs.readFileSync('/foo2', 'utf8')); // bar

// GET method route
app.get('*', function (req, res) {
  const filePath = req.path;
  let fsPath = path.resolve(__dirname, filePath.slice(1));
  let file = getFile(fsPath);
  if (file !== null) {
    res.contentType(mime.getType(filePath.split('.').pop()));
    res.send(file);
  } else {
    res.send(404);
  }
});

app.listen(3000, function () {
  console.log('Ready');
});