let {Worksheet, Column, Range, Image, DataValidations, Table} = require('./xLib');
let xRow = require('./xRow');

class xWorksheet extends Worksheet {

    newRow(rowModel, options) {
        let {wtrowx} = options;
        let _row = new xRow(this, wtrowx);
        this._rows[wtrowx - 1] = _row;
        _row.setModel(rowModel);
    }

    newCell(cellModel, options) {
        if(!this.mergeCell(cellModel, options)) {
            let {wtrowx} = options;
            let _row = this._rows[wtrowx - 1];
            _row.newCell(cellModel, options);
        };

    }

    mergeCell(cellModel, options) {
        let {wtrowx, wtcolx, rdrowx, rdcolx, sheetModel} = options;
        if (! sheetModel.mcTopLeft) {
            return
        }
        let topLeft = sheetModel.mcTopLeft[[rdrowx, rdcolx]];
        if(topLeft) {
            let alreadySet = this.rangeAlreadySet[[rdrowx, rdcolx]];
            if(alreadySet) {
                this._merges[[alreadySet.top, alreadySet.left]] = alreadySet;
            }
            this.rangeAlreadySet[[rdrowx, rdcolx]] = new Range([wtrowx, wtcolx, wtrowx, wtcolx]);
        } else {
            let alreadySet = sheetModel.mcAlreadySet[[rdrowx, rdcolx]];
            if(alreadySet) {
                let range = this.rangeAlreadySet[alreadySet];
                range.expand(wtrowx, wtcolx, wtrowx, wtcolx);
                let master = this.getCell(range.top, range.left);
                let cell = this.getCell(wtrowx, wtcolx)
                cell.merge(master);
                cell.style = cellModel.style; //recover lost style of merged cell
                return true;
            }
        }
    }

    setMerges() {
        for(let alreadySet in this.rangeAlreadySet) {
            this._merges[alreadySet] = this.rangeAlreadySet[alreadySet];
        };
    }

    setModel(sheetModel) {
        this._columns = Column.fromModel(this, sheetModel.cols);
        this._rows = [];
        this.dataValidations = new DataValidations(sheetModel.dataValidations);
        this.properties = sheetModel.properties;
        this.pageSetup = sheetModel.pageSetup;
        this.headerFooter = sheetModel.headerFooter;
        this.views = sheetModel.views;
        this.autoFilter = sheetModel.autoFilter;
        this._media = sheetModel.media.map(medium => new Image(this, medium));
        this.sheetProtection = sheetModel.sheetProtection;
        this.tables = sheetModel.tables.reduce(
            (tables, table) => {
            let t = new Table;
            t.model = table;
            tables[table.name] = t;
            return tables;
            },
            {}
        );
    }

}

module.exports = xWorksheet;
