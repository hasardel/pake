
/*
 * pake
 * https://github.com/hasardel/pake
 *
 * Copyright (c) 2014 Emmanuel Pouthier
 * Licensed under the MIT license.
 * https://github.com/hasardel/pake/blob/master/LICENSE
 */

declare var require: any;
declare var process: any;
var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');

/// <reference path="./CommandLineParser.ts" />
/// <reference path="./JsonFile.ts" />

module pake {

    export class Pake {

        private _commandLineParser: CommandLineParser;
        private _jsonFile: JsonFile;
        private _templatesDirectory: string = '';
        private _modulesDirectory: string = '';
        private _scriptsDirectory: string = '';
        private _buildDirectory: string = '';
        private _templates: any;
        private _modules: any;
        private _resolveList: any;

        constructor() {
            this._commandLineParser = new CommandLineParser();
            this._jsonFile = new JsonFile();
            this._templatesDirectory = process.cwd() + '/templates';
            this._modulesDirectory = process.cwd() + '/modules';
            this._buildDirectory = process.cwd() + '/build';
            this._templates = new Object();
            this._modules = new Object();
            this._resolveList = new Array();
        }

        run() {
            var res = this._commandLineParser.parse(process.argv);

            // options
            if (res.templatesDir) { this._templatesDirectory = path.resolve(res.templatesDir); }
            if (res.modulesDir) { this._modulesDirectory = path.resolve(res.modulesDir); }
            if (res.buildDir) { this._buildDirectory = path.resolve(res.buildDir); }
            
            // command
            if (res.command === 'create') {
                if (res.templateName) {
                    this._create(res.moduleName, res.templateName);
                } else {
                    this._create(res.moduleName);
                }
            } else if (res.command === 'dependencies') {
                if (res.subcommand === 'add') {
                    this._dependenciesAdd(res.moduleName, res.dependencyNames);
                } else if (res.subcommand === 'remove') {
                    this._dependenciesRemove(res.moduleName, res.dependencyNames);
                } else if (res.subcommand === 'list') {
                    if (res.moduleNames) {
                        this._dependenciesList(res.moduleNames);
                    } else {
                        this._dependenciesList();
                    }
                }
            } else if (res.command === 'resolve') {
                if (res.moduleNames) {
                    this._resolve(res.moduleNames);
                } else {
                    this._resolve();
                }
            }
            
            console.log('-> success');
        }

        private _create(moduleName: string, templateName: string = 'default') {
            // scan templates directory
            if (! this._scanTemplatesDirectory()) {
                process.exit(1);
            }

            // template exist ?
            var template = this._searchTemplate(templateName);
            if (! template) {
                if (templateName === 'default') {
                    template = new Object();
                } else {
                    console.log('-> error: template "' + templateName + '" is not found !');
                    process.exit(1);
                }
            }

            // scan modules directory
            if (! this._scanModulesDirectory()) {
                process.exit(1);
            }

            // module exist ?
            if (this._searchModule(moduleName)) {
                console.log('-> error: module "' + moduleName + '" is already created !');
                process.exit(1);
            }
            
            if (fs.existsSync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)))) {
                console.log('-> error: directory name is already used');
                process.exit(1);
            }
            
            // copy template
            console.log('Create module ...');
            fse.mkdirpSync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)));
            if (fs.existsSync(path.join(this._templatesDirectory, templateName.replace(/\./g, path.sep)))) {
                fse.copySync(path.join(this._templatesDirectory, templateName.replace(/\./g, path.sep)), path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)));
            }
            
            // update pake.json
            console.log('Update "pake.json" ...');
            template['name'] = moduleName;
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), template);
        }

        private _dependenciesAdd(moduleName: string, dependencyNames: string[]) {
            // scan modules directory
            if (! this._scanModulesDirectory()) {
                process.exit(1);
            }

            // moduleName exist ?
            var module = this._searchModule(moduleName);
            if (! module) {
                console.log('-> error: module "' + moduleName + '" is not found !');
                process.exit(1);
            }

            // add dependencies
            for (var idx in dependencyNames) {
                if (dependencyNames[idx] === moduleName) {
                    console.log('-> warning: cyclic dependency "' + dependencyNames[idx] + '" !');
                    continue;
                }
                
                // dependency exist ?
                if (! this._searchModule(dependencyNames[idx])) {
                    console.log('-> warning: dependency not found "' + dependencyNames[idx] + '" !');
                    continue;
                }
                
                // dependency already added ?
                if (module['dependencies']) {
                    if (module['dependencies'].indexOf(dependencyNames[idx]) > -1) {
                        console.log('-> warning: dependency "' + dependencyNames[idx] + '" is already added !');
                        continue;
                    }
                }
                
                // add dependency
                console.log('Add dependency "' + dependencyNames[idx] + '" ...');
                
                if (! module['dependencies']) {
                    module['dependencies'] = new Array();
                }
                
                module['dependencies'].push(dependencyNames[idx]);
            }
            
            // update pake.json
            console.log('Update "pake.json" ...');
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), module);
        }

        private _dependenciesRemove(moduleName: string, dependencyNames: string[]) {
            // scan modules directory
            if (! this._scanModulesDirectory()) {
                process.exit(1);
            }

            // moduleName exist ?
            var module = this._searchModule(moduleName);
            if (! module) {
                console.log('-> error: module "' + moduleName + '" is not found !');
                process.exit(1);
            }

            // remove dependencies
            if (module['dependencies']) {
                var dependencyIdx: number = 0;
                for (var idx in dependencyNames) {
                    // dependency exist ?
                    dependencyIdx = module['dependencies'].indexOf(dependencyNames[idx]);
                    if (dependencyIdx > -1) {
                        // remove dependency
                        console.log('Remove dependency "' + dependencyNames[idx] + '" ...');
                        module['dependencies'].splice(dependencyIdx, 1);
                    } else {
                        console.log('-> warning: dependency not found "' + dependencyNames[idx] + '" !');
                    }
                }
            } else {
                console.log('-> error: module "' + moduleName + '" has not dependencies !');
                process.exit(1);
            }
            
            // update pake.json
            console.log('Update "pake.json" ...');
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), module);
        }
        
        private _dependenciesList(moduleNames: string[] = null) {
            console.log('deps list ' + moduleNames);
        }

        private _resolve(moduleNames: string[] = null) {
            // create build directory
            console.log('Create build directory ...');
            if (fs.existsSync(this._buildDirectory)) { fse.removeSync(this._buildDirectory); }
            fs.mkdirSync(this._buildDirectory);
            
            // scan modules directory
            if (! this._scanModulesDirectory()) {
                process.exit(1);
            }
            
            // reset resolve list
            this._resolveList = new Array();
            
            // resolve
            if (moduleNames) {
                for (var idx in moduleNames) {
                    var moduleName = moduleNames[idx];
                    this._resolveModule(moduleName);
                }
            } else {
                for (var moduleName in this._modules) {
                    this._resolveModule(moduleName);
                }
            }
        }
        
        private _resolveModule(moduleName: string) {
            // is already copied ?
            if (this._resolveList.indexOf(moduleName) < 0) {

                // moduleName exist ?
                var module = this._searchModule(moduleName);
                if (! module) {
                    console.log('-> error: module "' + moduleName + '" is not found !');
                    process.exit(1);
                }
                
                // copy module
                console.log('Copy module "' + moduleName + '" ...');
                fse.mkdirpSync(path.join(this._buildDirectory, moduleName.replace(/\./g, path.sep)));
                fse.copySync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)), path.join(this._buildDirectory, moduleName.replace(/\./g, path.sep)));
                
                // update resolve list
                this._resolveList.push(moduleName);
                
                // resolve dependencies
                if (module['dependencies']) {
                    console.log('Resolve dependencies (' + module['dependencies'].length + ' found) ...');            
                    for (var idx in module['dependencies']) {
                        this._resolveModule(module['dependencies'][idx]);
                    }
                }
            }
        }

        private _searchTemplate(templateName: string): any {
            console.log('Search template "' + templateName + '" ...');

            // search template
            for (var template in this._templates) {
                if (template === templateName) {
                    return this._templates[template];
                }
            }

            return null;
        }

        private _searchModule(moduleName: string): any {
            console.log('Search module "' + moduleName + '" ...');

            // search module
            for (var module in this._modules) {
                if (module === moduleName) {
                    return this._modules[module];
                }
            }

            return null;
        }

        private _scanModulesDirectory(): boolean {
            console.log('Scan modules directory ("' + this._modulesDirectory + '") ...');

            // reset modules tree
            this._modules = new Object();

            // modules directory exist ?
            if (fs.existsSync(this._modulesDirectory)) {

                // is directory ?
                if (! fs.lstatSync(this._modulesDirectory).isDirectory()) {
                    console.log('-> error: modules directory is not directory !');
                    return false;
                }

                // pake.json ?
                if (fs.existsSync(path.join(this._modulesDirectory, 'pake.json'))) {
                    console.log('-> error: root modules directory could not contain pake.json !');
                    return false;
                }

                // scan root modules directory
                this._scanDirectory(this._modules, this._modulesDirectory);

            } else {
                console.log('-> info: create modules directory');
                fs.mkdirSync(this._modulesDirectory);
            }

            return true;
        }
        
        private _scanTemplatesDirectory(): boolean {
            console.log('Scan templates directory ("' + this._templatesDirectory + '") ...');

            // reset templates tree
            this._templates = new Object();

            // templates directory exist ?
            if (fs.existsSync(this._templatesDirectory)) {
                
                // is directory ?
                if (! fs.lstatSync(this._templatesDirectory).isDirectory()) {
                    console.log('-> error: templates directory is not directory !');
                    return false;
                }
                
                // pake.json ?
                if (fs.existsSync(path.join(this._templatesDirectory, 'pake.json'))) {
                    console.log('-> error: root templates directory could not contain pake.json !');
                    return false;
                }
                
                // scan root templates directory
                this._scanDirectory(this._templates, this._templatesDirectory);
            }

            return true;
        }
        
        private _scanDirectory(node: any, directory: string, name: string = '') {
            // pake json ?
            var file = path.join(directory, 'pake.json');
            if (fs.existsSync(file)) {
                var json = this._jsonFile.readFile(file);
                if (json) {
                    node[name] = json;
                } else {
                    console.log('-> warning: could not read "pake.json" of "' + name + '" !');
                }
            }

            // scan dir
            var files = fs.readdirSync(directory);
            var dir;

            for (var idx in files) {
                dir = path.join(directory, files[idx]);

                // is directory ?
                if (fs.lstatSync(dir).isDirectory()) {
                    this._scanDirectory(node, dir, ((name === '') ? (path.basename(dir)) : (name + '.' + path.basename(dir))));
                }
            }
        }

    }

}

// main
process.title = 'pake';
new pake.Pake().run();

