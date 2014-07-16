
module pake {
    
    export class JsonFile {
        
        private _nbrSpaces: number = 2;
        
        getNbrSpaces(): number {
            return this._nbrSpaces;
        }
        
        setNbrSpaces(nbrSpaces: number) {
            this._nbrSpaces = nbrSpaces;
        }
        
        readFile(file): any {
            var obj = null;

            try {
                obj = JSON.parse(fs.readFileSync(file));
            } catch (err) {
                return null;
            }
            
            return obj;
        }

        writeFile(file, obj) {
            var str = JSON.stringify(obj, null, this._nbrSpaces);
            fs.writeFileSync(file, str);
        }
        
    }
    
}