let {colCache, Image} = require('./exceljslib');

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
        let {top, left, bottom, right} = colCache.decodeEx(cellRange);
        this._firstRow = top;
        this._lastRow = bottom;
        this._firstCol = left;
        this._lastCol = right;
    }

    newRange() {
        if (this.startWtrowx === this.endWtrowx && this.startWtcolx === this.endWtcolx) {
            return;
        }
        let range = [this.startWtrowx, this.startWtcolx, this.endWtrowx, this.endWtcolx];
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
        if(!sheetModel.mergeCells){
            return;
        }
        sheetModel.mergeCells.forEach(mergeCell => {
            let _merge = new CellMerge(mergeCell, this);
            this._mergeList.push(_merge);
        });
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

    collectRange(wtSheet) {
        for (let _merge of this._mergeList) {
            _merge.collectRange();
        }
        for (let range of this.rangeList) {
            wtSheet.mergeCellsWithoutStyle(range);
        }
        this.rangeList = [];
    }
}

class DataValidation extends MergeMixin {

    constructor(dv, addressList) {
        super();
        this.dv = dv;
        this.addressList = [];
        this.addressMap = {};
        for(let address of addressList){
            let {row,col} = colCache.decodeAddress(address);
            this.addressMap[[row,col]] = true;
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        let isIn = this.addressMap[[rdrowx,rdcolx]];
        if(isIn) {
            let address = colCache.encode(wtrowx,wtcolx);
            this.addressList.push(address);
        }
    }

    collectRange(wtSheet) {
        for(let address of this.addressList){
            wtSheet.dataValidations.add(address, this.dv);
        }
        this.addressList = [];
    }
}

class DvMerger extends MergerMixin {

    constructor(sheetModel) {
        super();
        this._mergeList = []
        this.getMergeList(sheetModel)
    }

    getMergeList(sheetModel){
        if(!sheetModel.dataValidations) {
            return;
        }
        let dvMap = new Map();
        for(let address in sheetModel.dataValidations) {
            if(!sheetModel.dataValidations.hasOwnProperty(address)){
                continue;
            }
            let dv = sheetModel.dataValidations[address];
            let dvList = dvMap.get(dv);
            if (dvList){
                dvList.push(address);
            } else {
                dvList = [address];
                dvMap.set(dv, dvList)
            }
        }
        for(let [dv, dvList] of dvMap.entries()) {
            let _merge = new DataValidation(dv, dvList);
            this._mergeList.push(_merge);
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        for (let _merge of this._mergeList) {
            _merge.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
        }
    }

    collectRange(wtSheet) {
        for (let _merge of this._mergeList) {
            _merge.collectRange(wtSheet);
        }
    }
}

class ImageMerge extends MergeMixin {

    constructor(image, merger, imageNoMap) {
        super();
        this.image = image;
        this.merger = merger;
        this.setRange()
        this.imageCopyMap = {};
        this.imageRefMap = {};
        let tl = image.range.tl;
        let br = image.range.br;
        this._firstRow = tl.nativeRow + 1;
        this._firstCol = tl.nativeCol + 1;
        this._lastRow = br.nativeRow + 1;
        this._lastCol = br.nativeCol + 1;
        let no = imageNoMap[this.topLeft] || 0;
        this.no = no;
        imageNoMap[this.topLeft] = no + 1;
    }

    get topLeft() {
        return [this._firstRow, this._firstCol];
    }

    get mergeKey() {
        return [this._firstRow, this._firstCol, this.no];
    }

    newRange() {
        if( this.startWtrowx===-1){
            return
        }
        let image = new Image(null, this.image);
        let tl = image.range.tl;
        let br = image.range.br;
        tl.nativeRow = this.startWtrowx - 1;
        tl.nativeCol = this.startWtcolx - 1;
        br.nativeRow = this.endWtrowx - 1;
        br.nativeCol = this.endWtcolx - 1;
        this.imageCopyMap[[this.startWtrowx, this.startWtcolx]] = image;
    }

    setImageRef(imageRef){
        let {wtTopLeft} = imageRef;
        this.imageRefMap[wtTopLeft] = imageRef;
    }

    collectRange(wtSheet, wtBook){
        this.newRange();
        this.setRange();
        for(let key in this.imageCopyMap) {
            if(!this.imageCopyMap.hasOwnProperty(key)){
                continue;
            }
            let image = this.imageCopyMap[key];
            let imageId;
            let ref = this.imageRefMap[key];
            if(ref){
                imageId = wtBook.addImage(ref.image);
            } else {
                imageId = wtBook.addImageFromMedia(image.imageId);
                //imageId = image.imageId;
                //if config
            }
            wtSheet.addImage(imageId, image.range);
        }
        this.imageCopyMap = {};
        this.imageRefMap = {};
    }
}

class ImageMerger extends MergerMixin {
    constructor(sheetModel) {
        super();
        this._mergeList = [];
        this._mergeMap = {};
        this.maxRow = 0;
        this.maxCol = 0;
        this.getMergeList(sheetModel)
    }

    getMergeList(sheetModel){
        if(!sheetModel.media || sheetModel.media.length===0){
            return;
        }
        let noMap = {};
        for(let medium of sheetModel.media){
            if(medium.type === "image" ) {
                let _merge = new ImageMerge(medium, this, noMap);
                this._mergeMap[_merge.mergeKey] = _merge;
                this._mergeList.push(_merge);
                this.maxRow = Math.max(this.maxRow, _merge._lastRow)
                this.maxCol = Math.max(this.maxCol, _merge._lastCol)
            }
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        for (let _merge of this._mergeList) {
            _merge.mergeCell(rdrowx, rdcolx, wtrowx, wtcolx);
        }
    }

    collectRange(wtSheet, wtBook) {
        for (let _merge of this._mergeList) {
            _merge.collectRange(wtSheet, wtBook);
        }
    }

    setImageRef(imageRef){
        let {mergeKey} = imageRef;
        let _merge = this._mergeMap[mergeKey];
        if( _merge){
            _merge.setImageRef(imageRef);
        }
    }

}

class AutoFilter extends MergeMixin {

    constructor(sheetModel) {
        super();
        if (!sheetModel.autoFilter){
            this.toMerge = false;
            return;
        }
        this.toMerge = true;
        this.setRange();
        let autoFilter = sheetModel.autoFilter;
        let {top, left, bottom, right} = colCache.decodeEx(autoFilter);
        this._firstRow = top;
        this._lastRow = bottom;
        this._firstCol = left;
        this._lastCol = right;
        this.firstAutoFilter = null;
    }

    newRange() {
        if(this.startWtrowx===-1) {
            return;
        }
        if(!this.firstAutoFilter){
            this.firstAutoFilter = [this.startWtrowx, this.startWtcolx,
                this.endWtrowx, this.endWtcolx];
        }
    }

    collectRange(wtSheet) {
        this.newRange();
        this.setRange();
        if( wtSheet.autoFilter){
            this.firstAutoFilter = null;
            return;
        }
        if( this.firstAutoFilter){
            wtSheet.autoFilter = colCache.encode(...this.firstAutoFilter)
            this.firstAutoFilter = null;
        }
    }
}

class Merger {
    constructor(sheetModel) {
        let cellMerger = new CellMerger(sheetModel)
        let dvMerger = new DvMerger(sheetModel)
        let imageMerger = new ImageMerger(sheetModel)
        this.imageMerger = imageMerger;
        let autoFilter = new AutoFilter(sheetModel)
        let _mergerList = [cellMerger, autoFilter, dvMerger, imageMerger];
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
