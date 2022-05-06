//let {SheetResource} = require('../sheetresource');

let {Merger} = require('./merger')
let {BorderInfo} = require('./borderinfo')
let {Root, RowNode, XNode} = require('../node');
let {NodeMap} = require('../nodemap');
let {Env} = require("../env");
let {getCellNode} = require('./getcellnode');

class SheetResource {

    constructor(sheetModel, bookWriter) {
        this.sheetModel = sheetModel;
        this.bookModel = bookWriter.bookModel;
        this.nodeMap = new NodeMap();
        this.env = new Env(this.nodeMap, 1);
        this.merger = new Merger(sheetModel);
        let borderInfo = this.bookModel.getBorderInfo(this.sheetModel.index);
        this.borderInfo = new BorderInfo(borderInfo);
        this.sheetTree = this.build();
        let tplStr = this.sheetTree.toTag();
        //console.log(tplStr);
        this.tplTree = this.env.compile(tplStr);
    }

    renderSheet(sheetWriter, context)
    {
        //console.log(sheetWriter);
        //console.log(context);
        this.sheetTree.setSheetWriter(sheetWriter);
        this.tplTree.render(context);
        this.merger.collectRange(sheetWriter.wtSheet, sheetWriter.wtBook)
    }

    build() {
        let sheetModel = this.sheetModel;
        let nodeMap = this.nodeMap;
        //let merger = this.merger;
        let root = new Root(sheetModel.order, nodeMap);
        if(sheetModel.data === null || !sheetModel.data.length > 0){
            return root;
        }
        let maxRowx = -1;
        let maxColx = -1;
        let data = sheetModel.data;
        for(let r = 0; r < data.length; r++ ) {
            let row = data[r];
            for (let c = 0; c < row.length; c++) {
                let cell = row[c];
                if (cell!=null) {
                    maxColx = Math.max(maxColx, c);
                    maxRowx = Math.max(maxRowx, r);
                }
            }
        }
        //console.log(maxRowx, maxColx);

        for(let r = 0; r <= maxRowx; r++ ) {
            let row = data[r];
            let rowNode = new RowNode(r);
            root.addChild(rowNode);
            for(let c = 0; c <= maxColx; c++ ) {
                let cell = row[c];
                let cellNode = getCellNode(cell, r, c);
                root.addChild(cellNode);
                if (c===0 && cellNode.cellTag && cellNode.cellTag.beforerow) {
                    rowNode.cellTag = cellNode.cellTag;
                }
            }
        }
        root.addChild(new XNode());
        return root;
    }

    merge(rdrowx, rdcolx, wtrowx, wtcolx, wtSheet, wtBook) {
        this.merger.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
        let border = this.borderInfo.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
        if( border){
            //wtBook.setCellFormat(wtrowx, wtcolx, 'bd', border,  {order:wtSheet.order});
            wtSheet.config.borderInfo.push(border);
        }

    }
}

class SheetResourceMap {
    constructor(bookWriter) {
        this.bookWriter = bookWriter;
        this.bookModel = bookWriter.bookModel;
        this.map = new Map();
    }

    getSheetResource(context) {
        let name = context["tplName"] || context["tpl_name"];
        let order = context["tplIndex"] || context["tpl_index"];
        let sheetModel = this.bookModel.getSheet(name, order);
        let changed = context['changed'];
        let sheetName = sheetModel.name;
        let sheetResource = this.map.get(sheetName);
        if (changed || !sheetResource) {
            sheetResource = new SheetResource(sheetModel, this.bookWriter);
            this.map[sheetName] = sheetResource;
        }
        return sheetResource;
    }
}

module.exports = { SheetResourceMap}
