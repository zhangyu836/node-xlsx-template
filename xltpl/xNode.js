let {Cell} = require('./xLib');
let {reSv, reXv} = require('./xUtil');
let {RichText, containTag} = require('./xRich');

class xlRow {
    constructor(rootSheet, rowModel, rdrowx) {
        this.rootSheet = rootSheet;
        this.rowModel = rowModel;
        this.rdrowx = rdrowx;
    }

    setTarget(sheet) {
        if( this.rowModel) {
            let options = {wtrowx: this.rootSheet.wtrowx};
            sheet.newRow(this.rowModel, options)
        } else {
            this.rootSheet.nextRow();
        }
    }

    handleRv() {
        this.setTarget(this.rootSheet.targetSheet);
    }

    toTag() {
        return `{% row ${this.number} %}\n`;
    }
}

class xlCell {
    constructor(rootSheet, cellModel, rdrowx, rdcolx, islast) {
        this.rootSheet = rootSheet;
        this.cellModel = cellModel;
        this.islast = islast;
        this.rdrowx = rdrowx;
        this.rdcolx = rdcolx;
        this.type = xlCell.Types.AsIs;
        this.xv = null;
        if(!cellModel) {
            return;
        }
        switch(cellModel.type) {
            case Cell.Types.String:
                if(reXv.test(cellModel.value)) {
                    this.type = xlCell.Types.Xv;
                } else if(reSv.test(cellModel.value)) {
                    this.type = xlCell.Types.Sv;
                }
                break;
            case Cell.Types.RichText:
                let richText = cellModel.value.richText;
                if( containTag(richText) ) {
                    this.rich = new RichText(this, richText);
                    this.type = xlCell.Types.Rich;
                }
                break;
            default:

        }
    }

    setTarget(sheet, rv) {
        if( this.cellModel) {
            let targetModel = Object.assign({}, this.cellModel);
            switch(this.type) {
                case xlCell.Types.AsIs:                    
                    break;
                case xlCell.Types.Xv:
                    if (!this.xv) {
                        targetModel.type = Cell.Types.Null;
                    } else {
                        targetModel.value = this.xv;
                    }
                    break;
                case xlCell.Types.Sv:
                    targetModel.value = rv;
                    break;
                case xlCell.Types.Rich:
                    let richText = this.rich.handleRv(rv);
                    targetModel.value = {richText};
                    break;
                default :
                
            }
            if (targetModel.type === Cell.Types.Formula){
                targetModel.result = undefined;
            }
            let {wtrowx, wtcolx, sheetModel} = this.rootSheet;
            let {rdrowx, rdcolx} = this;
            let options = {wtrowx, wtcolx, rdrowx, rdcolx, sheetModel};
            sheet.newCell(targetModel, options);
        }
        if(!this.islast) {
            this.rootSheet.nextCell();
        } else {
            this.rootSheet.nextRow();
        }
    }

    getSection(number) {
        return this.rich.getSection(number);
    }

    handleRv(rv) {
        this.setTarget(this.rootSheet.targetSheet, rv);
    }

    handleXv(xv) {
        if ( this.type == xlCell.Types.Xv) {
            this.xv = xv;
        }
    }

    toTag() {
        switch(this.type) {
            case xlCell.Types.AsIs:
                return `{% cell ${this.number} %}{% endcell %}\n`;
            case xlCell.Types.Xv:
            case xlCell.Types.Sv:
                return `{% cell ${this.number} %}${this.cellModel.value}{% endcell %}\n`;
            case xlCell.Types.Rich:
                return `{% cell ${this.number} %}${this.rich.toTag()}{% endcell %}\n`;
            default:
                console.log(this.type);
                return
        }
    }
}

xlCell.Types = {
    AsIs: 0,
    Xv: 1,
    Sv: 2,
    Rich: 3
}

class xlTag {

    constructor(rootSheet, tag) {
        this.rootSheet = rootSheet;
        this.tag = tag;
    }

    toTag() {
        return this.tag;
    }
}


class xlSheet {
    constructor(sheetModel) {
        this.sheetModel = sheetModel;
        this.wtrowx = 1;
        this.wtcolx = 1;
        this.nodes = [];
    }

    nextRow() {
        this.wtrowx++;
        this.wtcolx = 1;
    }

    nextCell() {
        this.wtcolx++;
    }

    addNode(node) {
        node.number = this.nodes.length;
        this.nodes.push(node);
    }

    getNode(number) {
        this.currentNode = this.nodes[number];
        return this.currentNode;
    }

    getSection(number) {
        return this.currentNode.getSection(number);
    }

    toTag() {
        return this.nodes.map(node => node.toTag()).join('');
    }

    reset() {
        this.wtrowx = 1;
        this.wtcolx = 1;
    }

}

module.exports = {xlSheet, xlRow, xlCell, xlTag}