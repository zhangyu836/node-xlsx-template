let {Cell} = require('./exceljslib');
let {RichTextExceljs} = require('./richtext')
let {CellNode, XvCell, TagCell, RichTagCell} = require('../cellnode')
let {findCellTag, reTag, reBlockSplit, isVariableNoSpace, isXv } = require('../celltag');

class CellModel {
    constructor(model) {
        this.model = model;
        this.rv = null;
    }

    get isNull() {
        return !this.model;
    }

    get isNullCell() {
        return this.model.type === Cell.Types.Null ||
            this.model.type === Cell.Types.Merge;
    }

    get isRich() {
        return this.model.type === Cell.Types.RichText;
    }

    get isText() {
        return this.model.type === Cell.Types.String;
    }

    get text() {
        return this.model.value;
    }

    get rich() {
        return new RichTextExceljs(this.model.value.richText);
    }

    writeCell(cellNode, wtCell) {
        wtCell.style = this.model.style;
        if (this.isNullCell){
            return
        }
        if (cellNode.rv!=null){
            if(Array.isArray(cellNode.rv)) {
                wtCell.value = {richText:cellNode.rv};
            } else {
                wtCell.value = cellNode.rv;
            }
        } else if(this.rv!=null) {
            if(Array.isArray(this.rv)) {
                wtCell.value = {richText:this.rv};
            } else {
                wtCell.value = this.rv;
            }
        } else {
            wtCell.value = this.model.value;
        }
    }
}

function getCellNode(model, row, col) {
    let cellNode, cellTag;
    let cellModel = new CellModel(model);
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
