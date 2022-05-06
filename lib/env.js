let {NodeExtension, XvExtension, SegmentExtension, ImageExtension} = require('./extension');
let nunjucks = require("nunjucks");

class Env {

    constructor(nodeMap, offset) {
        let env = new nunjucks.Environment();
        env.addExtension('NodeExtension', new NodeExtension());
        env.addExtension('XvExtension', new XvExtension());
        env.addExtension('SegmentExtension', new SegmentExtension());
        env.addExtension('ImageExtension', new ImageExtension());
        env.nodeMap = nodeMap;
        this.env = env;
        this.offset = offset;
    }

    compile(tplStr) {
        let tplTree = nunjucks.compile(tplStr, this.env);
        try {
            tplTree.compile();
            return tplTree;
        } catch (e) {
            this.log(tplStr, e);
            throw e;
        }
    }

    log(tplStr, e) {
        //let logNumber = 20;
        let lines = tplStr.split('\n');
        //let start = Math.max(0, e.lineno - 1 - logNumber);
        //let end = Math.min(lines.length, e.lineno + logNumber);
        for(let i=0; i<lines.length; i++){
            let line = lines[i];
            if(i===e.lineno-1){
                this.logErrorLine(e, lines);
            } else {
                this.logLine(line, i+1);
            }
        }
        this.logErrorLine(e, lines);
    }

    getDebugInfo(line) {
        let pattern = /"(\d*,\d*[,\d]*)"/;
        let m = line.match(pattern);
        if(m) {
            let [, key ] = m;
            let node = this.env.nodeMap.getTagNode(key);
            if(node){
                return node.getDebugInfo(this.offset);
            }
        }
    }

    logLine(line, lineNo) {
        let debug = this.getDebugInfo(line);
        if(debug) {
            console.log(`line ${lineNo}: ${line}       <<<--- ${debug.address}`);
        } else {
            console.log(`line ${lineNo}: ${line}       <<<--- no match `);
        }
    }

    logErrorLine(e, lines) {
        let redFmt = '\x1b[31m%s\x1b[0m';
        let errorFmt = '\x1b[31m%s\x1b[0m\x1b[35m%s\x1b[0m\x1b[34m%s\x1b[0m';
        let errorLine = lines[e.lineno-1];
        if(errorLine){
            let p0 = errorLine.slice(0, e.colno-1);
            let p1 = errorLine.slice(e.colno-1);
            let debug = this.getDebugInfo(errorLine);
            console.log(redFmt, `Syntax Error in ${debug.address}`);
            console.log(errorFmt, 'Original text --->>>   ', debug.value, '');
            console.log(errorFmt, `line ${e.lineno}: `, p0, p1, );
        }
        console.log(redFmt, 'Error message: ' + e.message);
    }
}

module.exports = {Env}
