let {Root, RowNode, XNode} = require('../node');
let {NodeMap} = require('../nodemap');
let {Env} = require("../env");
let {Merger} = require('./merger')
let {getCellNode} = require('./getcellnode');
let {colCache, Column } = require('./exceljslib');

class SheetResource {

    constructor(sheetModel, bookWriter) {
        this.sheetModel = sheetModel;
        this.bookWriter = bookWriter;
        this.nodeMap = new NodeMap();
        this.env = new Env(this.nodeMap, 0);
        this.merger = new Merger(sheetModel);
        this.sheetTree = this.build();
        let tplStr = this.sheetTree.toTag();
        //console.log(tplStr);
        this.tplTree = this.env.compile(tplStr);
    }

    build() {
        let sheetModel = this.sheetModel;
        let nodeMap = this.nodeMap;
        let merger = this.merger;
        let cellModels = {};
        let rowModels = [];
        let {maxRow, maxCol} = merger.imageMerger;
        sheetModel.rows.forEach(rowModel => {
            rowModels[rowModel.number] = rowModel;
            rowModel.cells.forEach(cellModel => {
                let {row,col} = colCache.decodeAddress(cellModel.address);
                cellModels[[row, col]] = cellModel;
                maxRow = Math.max(maxRow, row);
                maxCol = Math.max(maxCol, col);
            });
        });

        sheetModel.columns = Column.fromModel(sheetModel, sheetModel.cols);

        let root = new Root(sheetModel.sheetNo, nodeMap);
        for(let r = 1; r <= maxRow; r++) {
            let rowModel = rowModels[r];
            let rowNode = new RowNode(rowModel);
            root.addChild(rowNode);
            if(rowModel){
                for(let c = 1; c <= maxCol; c++) {
                    let cellModel = cellModels[[r,c]];
                    let cellNode = getCellNode(cellModel, r, c);
                    root.addChild(cellNode);
                    if (c===1 && cellNode.cellTag && cellNode.cellTag.beforerow) {
                        rowNode.cellTag = cellNode.cellTag;
                    }
                }
            }
        }
        root.addChild(new XNode());
        return root;
    }

    merge(rdrowx, rdcolx, wtrowx, wtcolx) {
        this.merger.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
    }

    setImageRef(imageRef) {
        this.merger.setImageRef(imageRef);
    }

    renderSheet(sheetWriter, context)
    {
        //console.log(sheetWriter);
        //console.log(context);
        this.sheetTree.setSheetWriter(sheetWriter);
        this.tplTree.render(context);
        this.merger.collectRange(sheetWriter.wtSheet, sheetWriter.bookWriter.workbook)
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
            this.sheetResource = new SheetResource(this.sheetModel, this.bookWriter);
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

    getSheetResource(context) {
        let key = context["tplName"] || context["tpl_name"] ||
            context["tplIndex"] || context["tpl_index"];
        let sheetState = this.map.get(key) || this.map.get(0);
        return sheetState.getSheetResource();
    }
}

module.exports = { SheetResourceMap}
