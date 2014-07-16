var pake;
(function (pake) {
    var CommandLineParser = (function () {
        function CommandLineParser() {
            this._idx = 0;
            this._idxMax = 0;
        }
        CommandLineParser.prototype.printUsage = function () {
            var str = '';

            str += 'Usage: pake [<options>] command\n';
            str += '\n';
            str += 'where <options> is :\n';
            str += '  --templates-dir=DIR\n';
            str += '  --modules-dir=DIR\n';
            str += '  --build-dir=DIR\n';
            str += '  --help\n';
            str += '  -h\n';
            str += '\n';
            str += 'and <command> is: \n';
            str += '  create MODULENAME [TEMPLATENAME]\n';
            str += '  deps add MODULENAME DEPENDENCYNAMEn\n';
            str += '  deps remove MODULENAME DEPENDENCYNAMEn\n';
            str += '  deps list [MODULENAMEn]\n';
            str += '  resolve [MODULENAMEn]\n';

            console.log(str);
            process.exit(0);
        };

        CommandLineParser.prototype.parse = function (argv) {
            this._argv = argv;
            this._idxMax = argv.length;
            this._result = new Object();

            this._idx = 1;

            this._consumeArg();

            while (this._parseOptions())
                ;

            if (!this._parseCommand()) {
                this.printUsage();
            }

            return this._result;
        };

        CommandLineParser.prototype._nextArg = function () {
            if (this._idx < this._idxMax) {
                return this._argv[this._idx];
            } else {
                return null;
            }
        };

        CommandLineParser.prototype._consumeArg = function () {
            this._idx++;
        };

        CommandLineParser.prototype._restoreArg = function () {
            this._idx--;
        };

        CommandLineParser.prototype._parseVariable = function (variableName) {
            var arg = this._nextArg();

            if (arg) {
                this._result[variableName] = arg;
                this._consumeArg();
                return true;
            }

            return false;
        };

        CommandLineParser.prototype._parseArrayVariable = function (arrayName) {
            var array = [];
            var arg = '';

            arg = this._nextArg();
            if (arg) {
                array.push(arg);
                this._consumeArg();
            }

            do {
                arg = this._nextArg();
                if (arg) {
                    array.push(arg);
                    this._consumeArg();
                }
            } while(arg);

            if (array.length <= 0) {
                return false;
            }

            this._result[arrayName] = array;
            return true;
        };

        CommandLineParser.prototype._parseOptions = function () {
            var arg = this._nextArg();

            if (arg) {
                if ((arg.substr(0, 2) === '--') || (arg.substr(0, 1) === '-')) {
                    if (arg.substr(0, 16) === '--templates-dir=') {
                        this._result['templatesDir'] = arg.substr(16);
                    } else if (arg.substr(0, 14) === '--modules-dir=') {
                        this._result['modulesDir'] = arg.substr(14);
                    } else if (arg.substr(0, 12) === '--build-dir=') {
                        this._result['buildDir'] = arg.substr(12);
                    } else {
                        this.printUsage();
                    }

                    this._consumeArg();
                    return true;
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseCommand = function () {
            return (this._parseCreate() || this._parseDependencies() || this._parseResolve());
        };

        CommandLineParser.prototype._parseCreate = function () {
            var arg = this._nextArg();

            if (arg) {
                if (arg === 'create') {
                    this._result['command'] = 'create';
                    this._consumeArg();

                    if (this._parseVariable('moduleName')) {
                        this._parseVariable('templateName');
                        return true;
                    }

                    this._restoreArg();
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseDependencies = function () {
            var arg = this._nextArg();

            if (arg) {
                if ((arg === 'dependencies') || (arg === 'deps')) {
                    this._result['command'] = 'dependencies';
                    this._consumeArg();

                    if (this._parseDependenciesAdd() || this._parseDependenciesRemove() || this._parseDependenciesList()) {
                        return true;
                    }

                    this._restoreArg();
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseDependenciesAdd = function () {
            var arg = this._nextArg();

            if (arg) {
                if (arg === 'add') {
                    this._result['subcommand'] = 'add';
                    this._consumeArg();

                    if (this._parseVariable('moduleName')) {
                        if (this._parseArrayVariable('dependencyNames')) {
                            return true;
                        }

                        this._restoreArg();
                    }

                    this._restoreArg();
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseDependenciesRemove = function () {
            var arg = this._nextArg();

            if (arg) {
                if (arg === 'remove') {
                    this._result['subcommand'] = 'remove';
                    this._consumeArg();

                    if (this._parseVariable('moduleName')) {
                        if (this._parseArrayVariable('dependencyNames')) {
                            return true;
                        }

                        this._restoreArg();
                    }

                    this._restoreArg();
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseDependenciesList = function () {
            var arg = this._nextArg();

            if (arg) {
                if (arg === 'list') {
                    this._result['subcommand'] = 'list';
                    this._consumeArg();

                    this._parseArrayVariable('moduleNames');

                    return true;
                }
            }

            return false;
        };

        CommandLineParser.prototype._parseResolve = function () {
            var arg = this._nextArg();

            if (arg) {
                if (arg === 'resolve') {
                    this._result['command'] = 'resolve';
                    this._consumeArg();

                    this._parseArrayVariable('moduleNames');

                    return true;
                }
            }

            return false;
        };
        return CommandLineParser;
    })();
    pake.CommandLineParser = CommandLineParser;
})(pake || (pake = {}));
var pake;
(function (pake) {
    var JsonFile = (function () {
        function JsonFile() {
            this._nbrSpaces = 2;
        }
        JsonFile.prototype.getNbrSpaces = function () {
            return this._nbrSpaces;
        };

        JsonFile.prototype.setNbrSpaces = function (nbrSpaces) {
            this._nbrSpaces = nbrSpaces;
        };

        JsonFile.prototype.readFile = function (file) {
            var obj = null;

            try  {
                obj = JSON.parse(fs.readFileSync(file));
            } catch (err) {
                return null;
            }

            return obj;
        };

        JsonFile.prototype.writeFile = function (file, obj) {
            var str = JSON.stringify(obj, null, this._nbrSpaces);
            fs.writeFileSync(file, str);
        };
        return JsonFile;
    })();
    pake.JsonFile = JsonFile;
})(pake || (pake = {}));

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');

var pake;
(function (pake) {
    var Pake = (function () {
        function Pake() {
            this._templatesDirectory = '';
            this._modulesDirectory = '';
            this._scriptsDirectory = '';
            this._buildDirectory = '';
            this._commandLineParser = new pake.CommandLineParser();
            this._jsonFile = new pake.JsonFile();
            this._templatesDirectory = process.cwd() + '/templates';
            this._modulesDirectory = process.cwd() + '/modules';
            this._buildDirectory = process.cwd() + '/build';
            this._templates = new Object();
            this._modules = new Object();
            this._resolveList = new Array();
        }
        Pake.prototype.run = function () {
            var res = this._commandLineParser.parse(process.argv);

            if (res.templatesDir) {
                this._templatesDirectory = path.resolve(res.templatesDir);
            }
            if (res.modulesDir) {
                this._modulesDirectory = path.resolve(res.modulesDir);
            }
            if (res.buildDir) {
                this._buildDirectory = path.resolve(res.buildDir);
            }

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
        };

        Pake.prototype._create = function (moduleName, templateName) {
            if (typeof templateName === "undefined") { templateName = 'default'; }
            if (!this._scanTemplatesDirectory()) {
                process.exit(1);
            }

            var template = this._searchTemplate(templateName);
            if (!template) {
                if (templateName === 'default') {
                    template = new Object();
                } else {
                    console.log('-> error: template "' + templateName + '" is not found !');
                    process.exit(1);
                }
            }

            if (!this._scanModulesDirectory()) {
                process.exit(1);
            }

            if (this._searchModule(moduleName)) {
                console.log('-> error: module "' + moduleName + '" is already created !');
                process.exit(1);
            }

            if (fs.existsSync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)))) {
                console.log('-> error: directory name is already used');
                process.exit(1);
            }

            console.log('Create module ...');
            fse.mkdirpSync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)));
            if (fs.existsSync(path.join(this._templatesDirectory, templateName.replace(/\./g, path.sep)))) {
                fse.copySync(path.join(this._templatesDirectory, templateName.replace(/\./g, path.sep)), path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)));
            }

            console.log('Update "pake.json" ...');
            template['name'] = moduleName;
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), template);
        };

        Pake.prototype._dependenciesAdd = function (moduleName, dependencyNames) {
            if (!this._scanModulesDirectory()) {
                process.exit(1);
            }

            var module = this._searchModule(moduleName);
            if (!module) {
                console.log('-> error: module "' + moduleName + '" is not found !');
                process.exit(1);
            }

            for (var idx in dependencyNames) {
                if (dependencyNames[idx] === moduleName) {
                    console.log('-> warning: cyclic dependency "' + dependencyNames[idx] + '" !');
                    continue;
                }

                if (!this._searchModule(dependencyNames[idx])) {
                    console.log('-> warning: dependency not found "' + dependencyNames[idx] + '" !');
                    continue;
                }

                if (module['dependencies']) {
                    if (module['dependencies'].indexOf(dependencyNames[idx]) > -1) {
                        console.log('-> warning: dependency "' + dependencyNames[idx] + '" is already added !');
                        continue;
                    }
                }

                console.log('Add dependency "' + dependencyNames[idx] + '" ...');

                if (!module['dependencies']) {
                    module['dependencies'] = new Array();
                }

                module['dependencies'].push(dependencyNames[idx]);
            }

            console.log('Update "pake.json" ...');
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), module);
        };

        Pake.prototype._dependenciesRemove = function (moduleName, dependencyNames) {
            if (!this._scanModulesDirectory()) {
                process.exit(1);
            }

            var module = this._searchModule(moduleName);
            if (!module) {
                console.log('-> error: module "' + moduleName + '" is not found !');
                process.exit(1);
            }

            if (module['dependencies']) {
                var dependencyIdx = 0;
                for (var idx in dependencyNames) {
                    dependencyIdx = module['dependencies'].indexOf(dependencyNames[idx]);
                    if (dependencyIdx > -1) {
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

            console.log('Update "pake.json" ...');
            this._jsonFile.writeFile(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep), 'pake.json'), module);
        };

        Pake.prototype._dependenciesList = function (moduleNames) {
            if (typeof moduleNames === "undefined") { moduleNames = null; }
            console.log('deps list ' + moduleNames);
        };

        Pake.prototype._resolve = function (moduleNames) {
            if (typeof moduleNames === "undefined") { moduleNames = null; }
            console.log('Create build directory ...');
            if (fs.existsSync(this._buildDirectory)) {
                fse.removeSync(this._buildDirectory);
            }
            fs.mkdirSync(this._buildDirectory);

            if (!this._scanModulesDirectory()) {
                process.exit(1);
            }

            this._resolveList = new Array();

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
        };

        Pake.prototype._resolveModule = function (moduleName) {
            if (this._resolveList.indexOf(moduleName) < 0) {
                var module = this._searchModule(moduleName);
                if (!module) {
                    console.log('-> error: module "' + moduleName + '" is not found !');
                    process.exit(1);
                }

                console.log('Copy module "' + moduleName + '" ...');
                fse.mkdirpSync(path.join(this._buildDirectory, moduleName.replace(/\./g, path.sep)));
                fse.copySync(path.join(this._modulesDirectory, moduleName.replace(/\./g, path.sep)), path.join(this._buildDirectory, moduleName.replace(/\./g, path.sep)));

                this._resolveList.push(moduleName);

                if (module['dependencies']) {
                    console.log('Resolve dependencies (' + module['dependencies'].length + ' found) ...');
                    for (var idx in module['dependencies']) {
                        this._resolveModule(module['dependencies'][idx]);
                    }
                }
            }
        };

        Pake.prototype._searchTemplate = function (templateName) {
            console.log('Search template "' + templateName + '" ...');

            for (var template in this._templates) {
                if (template === templateName) {
                    return this._templates[template];
                }
            }

            return null;
        };

        Pake.prototype._searchModule = function (moduleName) {
            console.log('Search module "' + moduleName + '" ...');

            for (var module in this._modules) {
                if (module === moduleName) {
                    return this._modules[module];
                }
            }

            return null;
        };

        Pake.prototype._scanModulesDirectory = function () {
            console.log('Scan modules directory ("' + this._modulesDirectory + '") ...');

            this._modules = new Object();

            if (fs.existsSync(this._modulesDirectory)) {
                if (!fs.lstatSync(this._modulesDirectory).isDirectory()) {
                    console.log('-> error: modules directory is not directory !');
                    return false;
                }

                if (fs.existsSync(path.join(this._modulesDirectory, 'pake.json'))) {
                    console.log('-> error: root modules directory could not contain pake.json !');
                    return false;
                }

                this._scanDirectory(this._modules, this._modulesDirectory);
            } else {
                console.log('-> info: create modules directory');
                fs.mkdirSync(this._modulesDirectory);
            }

            return true;
        };

        Pake.prototype._scanTemplatesDirectory = function () {
            console.log('Scan templates directory ("' + this._templatesDirectory + '") ...');

            this._templates = new Object();

            if (fs.existsSync(this._templatesDirectory)) {
                if (!fs.lstatSync(this._templatesDirectory).isDirectory()) {
                    console.log('-> error: templates directory is not directory !');
                    return false;
                }

                if (fs.existsSync(path.join(this._templatesDirectory, 'pake.json'))) {
                    console.log('-> error: root templates directory could not contain pake.json !');
                    return false;
                }

                this._scanDirectory(this._templates, this._templatesDirectory);
            }

            return true;
        };

        Pake.prototype._scanDirectory = function (node, directory, name) {
            if (typeof name === "undefined") { name = ''; }
            var file = path.join(directory, 'pake.json');
            if (fs.existsSync(file)) {
                var json = this._jsonFile.readFile(file);
                if (json) {
                    node[name] = json;
                } else {
                    console.log('-> warning: could not read "pake.json" of "' + name + '" !');
                }
            }

            var files = fs.readdirSync(directory);
            var dir;

            for (var idx in files) {
                dir = path.join(directory, files[idx]);

                if (fs.lstatSync(dir).isDirectory()) {
                    this._scanDirectory(node, dir, ((name === '') ? (path.basename(dir)) : (name + '.' + path.basename(dir))));
                }
            }
        };
        return Pake;
    })();
    pake.Pake = Pake;
})(pake || (pake = {}));

process.title = 'pake';
new pake.Pake().run();
