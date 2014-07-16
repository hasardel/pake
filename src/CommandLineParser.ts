
/*
 * pake
 * https://github.com/hasardel/pake
 *
 * Copyright (c) 2014 Emmanuel Pouthier
 * Licensed under the MIT license.
 * https://github.com/hasardel/pake/blob/master/LICENSE
 */

module pake {

    export class CommandLineParser {

        // grammaire
        // =========
        // <cmdline> ::= pake <options> <command>
        // <options> ::= '--templates-dir=' . #dir | '--modules-dir=' . #dir | '--build-dir=' . #dir | '--help' | '-h'
        // <command> ::= <create> | <dependencies> | <resolve>
        // <create> ::= 'create' . #moduleName . [ #templateName ]
        // <dependencies> ::= ( 'dependencies' | 'deps' ) . ( <dependenciesAdd> | <dependenciesRemove> | <dependenciesList> )
        // <dependenciesAdd> ::= 'add' . #moduleName . ( #dependencyName )+
        // <dependenciesRemove> ::= 'remove' . #moduleName . ( #dependencyName )+
        // <dependenciesList> ::= 'list' . ( #moduleName )*
        // <resolve> ::= 'resolve' . ( #moduleName )*

        private _argv: any;
        private _idx: number = 0;
        private _idxMax: number = 0;
        private _result: any;

        printUsage() {
            var str: string = '';

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
        }

        parse(argv: any) {
            this._argv = argv;
            this._idxMax = argv.length;
            this._result = new Object();

            // remove 'pake' or 'node pake'
            this._idx = 1;
            // TODO fix bug windows node.exe au lieu de node
            //if (argv[0] === 'node') {
                this._consumeArg();
            //}
//console.log(this._argv);
            // parse command line
            while (this._parseOptions());

            if (!this._parseCommand()) {
                this.printUsage();
            }
//console.log(this._result);
            return this._result;
        }

        private _nextArg(): any {
            if (this._idx < this._idxMax) {
                return this._argv[this._idx];
            } else {
                return null;
            }
        }

        private _consumeArg() {
            this._idx++;
        }

        private _restoreArg() {
            this._idx--;
        }

        private _parseVariable(variableName: string): boolean {
            var arg = this._nextArg();

            if (arg) {
                this._result[variableName] = arg;
                this._consumeArg();
                return true;
            }

            return false;
        }
        
        private _parseArrayVariable(arrayName: string): boolean {
            var array: string[] = [];
            var arg: string = '';

            // first arg
            arg = this._nextArg();
            if (arg) {
                array.push(arg);
                this._consumeArg();
            }

            // other arg
            do {
                arg = this._nextArg();
                if (arg) {
                    array.push(arg);
                    this._consumeArg();
                }
            } while (arg);
            
            // check empty array
            if (array.length <= 0) {
                return false;
            }
            
            // save array in result
            this._result[arrayName] = array;
            return true;
        }

        private _parseOptions(): boolean {
            var arg = this._nextArg();

            if (arg) {
                if ((arg.substr(0, 2) === '--') || (arg.substr(0, 1) === '-')) {
                    if (arg.substr(0, 16) === '--templates-dir=') {
                        this._result['templatesDir'] = arg.substr(16);
                    } else if (arg.substr(0, 14) === '--modules-dir=') {
                        this._result['modulesDir'] = arg.substr(14);
                    } else if (arg.substr(0, 12) === '--build-dir=') {
                        this._result['buildDir'] = arg.substr(12);
                    } else { // --help -h ou autres
                        this.printUsage();
                    }

                    this._consumeArg();
                    return true;
                }
            }

            return false;
        }

        private _parseCommand(): boolean {
            return (this._parseCreate() || this._parseDependencies() || this._parseResolve());
        }

        private _parseCreate(): boolean {
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
        }

        private _parseDependencies(): boolean {
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
        }

        private _parseDependenciesAdd(): boolean {
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
        }

        private _parseDependenciesRemove(): boolean {
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
        }

        private _parseDependenciesList(): boolean {
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
        }
        
        private _parseResolve(): boolean {
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
        }

    }

}

