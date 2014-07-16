# Pake

## Install

```sh
$ npm install -g pake
```

Pake depends on [Node.js](http://nodejs.org/) and [npm](http://npmjs.org/).


## Usage

```sh
$ pake [<options>] command
```

where <options> is :
  --templates-dir=DIR
  --modules-dir=DIR
  --build-dir=DIR
  --help
  -h

and <command> is :
  create MODULENAME [TEMPLATENAME]
  deps add MODULENAME DEPENDENCYNAMEn
  deps remove MODULENAME DEPENDENCYNAMEn
  deps list [MODULENAMEn]
  resolve [MODULENAMEn]


