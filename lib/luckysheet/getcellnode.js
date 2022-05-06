let {RichTextLuckySheet} = require('./richtext')
let {CellNode, XvCell, TagCell, RichTagCell} = require('../cellnode')
let {findCellTag, reTag, reBlockSplit, isVariableNoSpace, isXv } = require('../celltag');

let base1904 = new Date(1900, 2, 1, 0, 0, 0);
function datenum_local(v, date1904) {
    let epoch = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), v.getHours(), v.getMinutes(), v.getSeconds());
    let dnthresh_utc = Date.UTC(1899, 11, 31, 0, 0, 0);

    if (date1904) epoch -= 1461 * 24 * 60 * 60 * 1000;
    else if (v >= base1904) epoch += 24 * 60 * 60 * 1000;
    return (epoch - dnthresh_utc) / (24 * 60 * 60 * 1000);
}

function getType(value) {
    if (value === null || value === undefined) {
        return 'g';
    }
    if (value instanceof String || typeof value === 'string') {
        return 's';
    }
    if (typeof value === 'number') {
        return 'n';
    }
    if (typeof value === 'boolean') {
        return 'n';
    }
    if (value instanceof Date) {
        return 'd';
    }
    return 'g';
}

class CellModel {
    constructor(model, row, col) {
        this.model = model;
        this.row = row;
        this.col = col;
        this.rv = null;
    }

    get isNull() {
        return this.model === null || !this.model.ct || !this.model.ct.t;
    }

    get isRich() {
        let ct = this.model.ct;
        return ct!=null && ct.t==="inlineStr" && ct.s!=null && ct.s.length>0;
        //return this.model.ct.t === 'inLineStr';
    }

    get isText() {
        return this.model.v instanceof String || typeof this.model.v === 'string';
        return (this.model.ct.t === 's' || (this.model.ct.t === 'g' &&
            (this.model.v instanceof String || typeof this.model.v === 'string')));
    }

    get text() {
        return this.model.v;
    }

    get rich() {
        return new RichTextLuckySheet(this.model.ct.s);
    }

    getWtCell(cellNode) {
        let wtCell = Object.assign({}, this.model);
        wtCell.ct = Object.assign({}, this.model.ct);
        if (cellNode.rv!=null){
            if(Array.isArray(cellNode.rv)) {
                wtCell.ct.s = cellNode.rv;
            } else {
                let t = getType(cellNode.rv);
                if (t==='g'){
                    wtCell.v = cellNode.rv.toString();
                    wtCell.m = cellNode.rv.toString();
                } else if(t==='s'){
                    wtCell.v = cellNode.rv;
                    wtCell.m = cellNode.rv;
                } else if(t==='n') {
                    wtCell.v = cellNode.rv;
                    if(wtCell.ct.t!='n'){
                        wtCell.ct.t = t;
                        wtCell.ct.fa = '##0.00';
                    }
                    delete wtCell.qp;
                    delete wtCell.m;
                } else if(t==='d') {
                    wtCell.v = datenum_local(cellNode.rv);
                    if(wtCell.ct.t!='d'){
                        wtCell.ct.t = t;
                        //let date = new Date();
                        //let num = date.valueOf()
                        wtCell.ct.fa = 'yyyy-MM-dd';
                    }
                    delete wtCell.qp;
                    delete wtCell.m;
                }

            }
        } else if(this.rv!=null) {
            if(Array.isArray(this.rv)) {
                wtCell.ct.s = this.rv;
            } else {
                wtCell.v = this.rv;
                wtCell.m = this.rv;
            }
        }
        return wtCell;
    }
}

function getCellNode(model, row, col) {
    let cellNode, cellTag;
    let cellModel = new CellModel(model, row, col);
    if(!cellModel.isNull && (cellModel.isText || cellModel.isRich)) {
        let text, rich;
        if(cellModel.isText){
            text = cellModel.text;
        } else {
            rich = cellModel.rich;
            text = rich.text;
        }
        if(reTag.test(text)) {
            if(reBlockSplit.test(text)){
                let ret = findCellTag(text);
                if (ret.cellTag){
                    cellTag = ret.cellTag;
                    text = ret.text;
                    if(rich) {
                        rich.chop(ret.head, ret.head2tail);
                    }
                }
            }
            if(text==="") {
                cellModel.rv = "";
            } else if(isVariableNoSpace(text)){
                cellNode = new XvCell(cellModel, row, col, text, false);
            } else if(isXv(text)) {
                cellNode = new XvCell(cellModel, row, col, text,true);
            } else if(reTag.test(text)){
                if(rich){
                    cellNode = new RichTagCell(cellModel, row, col, rich);
                } else {
                    cellNode = new TagCell(cellModel, row, col, text);
                }
            } else {
                if(cellTag){
                    if(rich){
                        cellModel.rv = rich;
                    } else {
                        cellModel.rv = text;
                    }
                }
            }
        }
    }
    if (!cellNode) {
        cellNode = new CellNode(cellModel, row, col);
    }
    if (cellTag) {
        cellNode.cellTag = cellTag;
    }
    return cellNode
}

module.exports = {getCellNode};
