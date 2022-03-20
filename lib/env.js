let {NodeExtension, XvExtension, SegmentExtension, ImageExtension} = require('./extension');
let nunjucks = require("nunjucks");

class Env {

    constructor(nodeMap) {
        let env = new nunjucks.Environment();
        env.addExtension('NodeExtension', new NodeExtension());
        env.addExtension('XvExtension', new XvExtension());
        env.addExtension('SegmentExtension', new SegmentExtension());
        env.addExtension('ImageExtension', new ImageExtension());
        env.nodeMap = nodeMap;
        this.env = env;
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
        let logNumber = 20;
        let lines = tplStr.split('\n');
        let start = Math.max(0, e.lineno - 1 - logNumber);
        let end = Math.min(lines.length, e.lineno + logNumber);
        for(let i=start; i<end; i++){
            let line = lines[i];
            if(i===e.lineno-1){
                this.logErrorLine(e, lines);
            } else {
                this.logLine(line, i);
            }
        }
        this.logErrorLine(e, lines);
    }

    logLine(line, lineNo) {
        let pattern = /(\d+),([A-Z]+\d+)[^"]*/;
        let m = line.match(pattern);
        if(m) {
            let [, , address,] = m;
            console.log(`${line}       <<<--- line ${lineNo+1}, Cell ${address}`);
        } else {
            console.log(`${line}       <<<--- line ${lineNo+1}`);
        }
    }

    logErrorLine(e, lines) {
        let redFmt = '\x1b[31m%s\x1b[0m';
        let errorFmt = '\x1b[35m%s\x1b[0m\x1b[34m%s\x1b[0m\x1b[31m%s\x1b[0m';
        let errorLine = lines[e.lineno-1];
        let p0 = errorLine.slice(0, e.colno-1);
        let p1 = errorLine.slice(e.colno-1);
        let pattern = /(\d+),([A-Z]+\d+)[^"]*/;
        let m = errorLine.match(pattern);
        if(m) {
            let [key,sheetNo,address,] = m;
            console.log(redFmt, `Error in Cell address ${address} of sheet ${sheetNo}`);
            let node = this.env.nodeMap.getTagNode(key);
            if(node && node.text){
                console.log(errorFmt, 'Original text --->>>   ', node.text, '   ');
            }
        } else {
            let nextLine = lines[e.lineno];
            let m2 = nextLine.match(pattern);
            if (m2) {
                let [,sheetNo,address,] = m2;
                console.log(redFmt, `Error in Cell address ${address} of sheet ${sheetNo}`);
            }
        }
        console.log(errorFmt, p0, p1, `       <<<---   line ${e.lineno}`);
        console.log(redFmt, e.message);
    }
}

module.exports = {Env}
