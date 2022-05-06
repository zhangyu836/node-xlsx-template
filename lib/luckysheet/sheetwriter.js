let {BorderInfo2} = require('./merger');

class SheetWriter {

    constructor(bookWriter, sheetResource, sheetName) {
        this.bookWriter = bookWriter;
        this.wtBook = bookWriter.bookModel;
        this.sheetResource = sheetResource;
        this.rdSheet = sheetResource.sheetModel;
        this.addSheet(sheetName);
        //this.merger = sheetResource.merger;
        //let borderInfo = this.wtBook.getBorderInfoCompute(this.rdSheet.index);
        //console.log(borderInfo);
        //this.borderInfo = new BorderInfo2(borderInfo);
        this.currentRowNum = -1;
        this.currentColNum = -1;
        this.currentRow = null;
        this.colNums = new Map();
    }

    addSheet(sheetName) {
        this.wtSheet = this.wtBook.addSheet(this.rdSheet, sheetName);
        this.order = this.wtSheet.order;
        this.name = sheetName;
        this.index = this.rdSheet.index;
    }

    setSheetResource(sheetResource) {
        this.sheetResource = sheetResource;
        this.rdSheet = sheetResource.sheetModel;
    }

    setRow(rdRowx, wtRowx) {
        //console.log(this.rdSheet);
        //console.log(this.rdSheet.config);
        let rowlen = this.rdSheet.config.rowlen;
        if(rowlen){
            let rl = rowlen[rdRowx];
            if( rl) {
                let rowInfo = {};
                rowInfo[wtRowx] = rl;
                this.wtBook.setRowHeight(rowInfo, this.order);
                //this.wtSheet.config.rowlen[wtRowx] = rl;
            }
        }
        let rowhidden = this.rdSheet.config.rowhidden;
        if(rowhidden){
            let rh = rowhidden[rdRowx];
            if (rh){
                this.wtBook.hideRow(wtRowx, this.order);
                //this.wtSheet.config.rowhidden[wtRowx] = rh;
            }
        }
    }

    setCol(rdColx, wtColx) {
        if(!this.colNums.get(wtColx)){
            //console.log(this.rdSheet.config);
            let collen = this.rdSheet.config.columnlen;
            if(collen) {
                let cl = collen[rdColx];
                if( cl) {
                    let colInfo = {};
                    colInfo[wtColx] = cl;
                    this.wtBook.setColumnWidth(colInfo, this.order);
                    //this.wtSheet.config.columnlen[wtColx] = cl;
                }
            }
            let colhidden = this.rdSheet.config.colhidden;
            if(colhidden){
                let ch = colhidden[rdColx];
                if( ch) {
                    this.wtBook.hideColumn(wtColx, this.order);
                    //this.wtSheet.config.colhidden[wtColx] = ch;
                }
            }
            this.colNums.set(wtColx,wtColx);
        }
    }

    writeRow(rowNode) {
        this.currentRowNum++;
        this.currentColNum = -1;
        let rowx = rowNode.model;
        this.setRow(rowx, this.currentRowNum);
    }

    writeCell(cellNode) {
        this.currentColNum++;
        this.sheetResource.merge(cellNode.row, cellNode.col, this.currentRowNum, this.currentColNum, this.wtSheet);
        this.setCol(cellNode.col, this.currentColNum);
        if(!cellNode.model.isNull) {
            let wtCell = cellNode.model.getWtCell(cellNode);
            delete wtCell.mc;
            if( cellNode.model.isRich)
            {
                this.wtSheet.data[this.currentRowNum][this.currentColNum] = wtCell;
                //this.wtBook.setCellValue(this.currentRowNum, this.currentColNum, wtCell, {order:this.order});
                //setCellValue set format of inlineStr to cell format
            } else {
                this.wtBook.setCellValue(this.currentRowNum, this.currentColNum, wtCell, this.order);
            }
            //this.wtBook.setCellFormat(this.currentRowNum, this.currentColNum, 'ct', wtCell.ct, {order:this.order});
        }
        //let border = this.borderInfo.mergeCell(cellNode.row, cellNode.col, this.currentRowNum, this.currentColNum);
        //if( border){
            //this.wtBook.setCellFormat(this.currentRowNum, this.currentColNum, 'bd', border,  {order:this.order});
        //    this.wtSheet.config.borderInfo.push(border);
        //}
    }

    setImageRef(imageRef) {
        imageRef.wtRow = this.currentRowNum;
        imageRef.wtCol = this.currentColNum + 1;
        this.merger.setImageRef(imageRef);
    }
}

class SheetWriterMap {
    constructor(bookWriter) {
        this.bookWriter = bookWriter;
        this.map = new Map();
    }

    getSheetWriter(sheetResource, sheetName) {
        let sheetWriter = this.map.get(sheetName);
        if (!sheetWriter) {
            sheetWriter = new SheetWriter(this.bookWriter, sheetResource, sheetName);
            this.map.set(sheetName, sheetWriter);
        } else {
            sheetWriter.setSheetResource(sheetResource);
        }
        return sheetWriter;
    }

    hasName(sheetName) {
        if(this.map.get(sheetName)){
            return true;
        }
    }

    clear() {
        this.map.clear();
    }
}

module.exports = {SheetWriter, SheetWriterMap};
