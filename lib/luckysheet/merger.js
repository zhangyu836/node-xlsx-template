
class MergeMixin {

    constructor() {
    }

    setRange(rdrowx = -1, rdcolx = -1, wtrowx = -1, wtcolx = -1) {
        this.startRdrowx = rdrowx;
        this.startRdcolx = rdcolx;
        this.startWtrowx = wtrowx;
        this.startWtcolx = wtcolx;
        this.endWtrowx = wtrowx;
        this.endWtcolx = wtcolx;
    }

    isInRange(rdrowx, rdcolx) {
        return this._firstRow <= rdrowx && rdrowx <= this._lastRow &&
            this._firstCol <= rdcolx && rdcolx <= this._lastCol;
    }

    toBeMerged(rdrowx, rdcolx) {
        if (rdrowx > this.startRdrowx) {
            return true;
        } else {
            return rdrowx === this.startRdrowx && rdcolx > this.startRdcolx;
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        if (!this.isInRange(rdrowx, rdcolx)) {
            return false;
        }
        if (this.startRdrowx === -1) {
            this.setRange(rdrowx, rdcolx, wtrowx, wtcolx);
        } else if (this.toBeMerged(rdrowx, rdcolx)) {
            this.endWtrowx = Math.max(this.endWtrowx, wtrowx);
            this.endWtcolx = Math.max(this.endWtcolx, wtcolx);
        } else {
            this.newRange();
            this.setRange(rdrowx, rdcolx, wtrowx, wtcolx);
        }
        return true;
    }

    newRange() { }

    collectRange() {
        this.newRange();
        this.setRange();
    }
}

class CellMerge extends MergeMixin {

    constructor(cellRange, merger) {
        super();
        this.merger = merger;
        this.setRange();
        let {c, cs, r, rs} = cellRange;
        this._firstRow = r;
        this._lastRow = r + rs -1;
        this._firstCol = c;
        this._lastCol = c + cs -1;
    }

    newRange() {
        if (this.startWtrowx === this.endWtrowx && this.startWtcolx === this.endWtcolx) {
            return;
        }
        let range = {//key: `${this.startWtrowx}_${this.startWtcolx}`, rs:this.startWtrowx,
            //cs:this.startWtcolx, r:this.endWtrowx, c:this.endWtcolx,
            row:[this.startWtrowx,this.endWtrowx], column:[this.startWtcolx, this.endWtcolx]};
        this.merger.addNewRange(range);
    }
}
class MergerMixin {

    constructor() {
    }

    get toMerge() {
        if (this._mergeList) {
            return true;
        }
    }

}

class CellMerger extends MergerMixin {

    constructor(sheetModel) {
        super();
        this.rangeList = [];
        this._mergeList = [];
        this.getMergeList(sheetModel);
    }

    getMergeList(sheetModel) {
        if(!sheetModel.config.merge){
            return;
        }
        for(let key in sheetModel.config.merge) {
            let mergeCell = sheetModel.config.merge[key];
            let _merge = new CellMerge(mergeCell, this);
            this._mergeList.push(_merge);
        };
    }

    addNewRange(range) {
        this.rangeList.push(range);
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        for (let _merge of this._mergeList) {
            let isInRange = _merge.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
            if( isInRange) {
                break;
            }
        }
    }

    collectRange(wtSheet, wtBook) {
        for (let _merge of this._mergeList) {
            _merge.collectRange();
        }
        for (let range of this.rangeList) {
            wtBook.setRangeMerge(range, wtSheet.order)
            //wtSheet.config.merge[range.key] = [range];
        }
        this.rangeList = [];
    }
}

class Merger {
    constructor(sheetModel) {
        let cellMerger = new CellMerger(sheetModel)
        //let dvMerger = new DvMerger(sheetModel)
        //let imageMerger = new ImageMerger(sheetModel)
        //this.imageMerger = imageMerger;
        //let autoFilter = new AutoFilter(sheetModel)
        let _mergerList = [cellMerger];//, autoFilter, dvMerger, imageMerger
        this.mergerList = [];
        for (let merger of _mergerList) {
            if (merger.toMerge) {
                this.mergerList.push(merger)
            }
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        for (let merger of this.mergerList) {
            merger.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
        }
    }

    collectRange(wtSheet, wtBook) {
        for (let merger of this.mergerList) {
            merger.collectRange(wtSheet, wtBook);
        }
    }

    setImageRef(imageRef){
        this.imageMerger.setImageRef(imageRef);
    }
}

module.exports = {Merger};
