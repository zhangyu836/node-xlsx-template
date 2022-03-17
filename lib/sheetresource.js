let {NodeMap} = require('./nodemap');
let {Merger} = require('./merger');
let {Env} = require("./env");

class SheetResource {

    constructor(bookWriter, sheetModel) {
        this.nodeMap = new NodeMap();
        this.env = new Env(this.nodeMap);
        this.buildTplTree(bookWriter, sheetModel);
    }

    buildTplTree(bookWriter, sheetModel) {
        this.nodeMap.clear();
        this.merger = new Merger(sheetModel);
        this.sheetModel = sheetModel;
        this.sheetTree = bookWriter.build(sheetModel, this.nodeMap, this.merger);
        let tplStr = this.sheetTree.toTag();
        //console.log(tplStr);
        this.tplTree = this.env.compile(tplStr);
    }

    renderSheet(sheetWriter, payload)
    {
        this.sheetTree.setSheetWriter(sheetWriter);
        this.tplTree.render(payload);
        this.merger.collectRange(sheetWriter.wtSheet, sheetWriter.wtBook)
    }
}

class SheetState {
    constructor(bookWriter, sheetModel) {
        this.bookWriter = bookWriter;
        this.sheetModel = sheetModel;
        this.sheetResource = null;
    }

    getSheetResource() {
        if(!this.sheetResource) {
            this.sheetResource = new SheetResource(this.bookWriter, this.sheetModel);
        }
        return this.sheetResource;
    }
}

class SheetResourceMap {
    constructor(bookWriter) {
        this.bookWriter = bookWriter;
        this.map = new Map();
    }

    addSheet(sheet) {
        let sheetState = new SheetState(this.bookWriter, sheet);
        this.map.set(sheet.name, sheetState);
        this.map.set(sheet.sheetNo-1, sheetState);
    }

    getSheetResource(payload) {
        let key = payload["tplName"] || payload["tpl_name"] ||
            payload["tplIndex"] || payload["tpl_index"];
        let sheetState = this.map.get(key) || this.map.get(0);
        return sheetState.getSheetResource();
    }
}

module.exports = { SheetResource, SheetState, SheetResourceMap}
