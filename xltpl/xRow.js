let {Row, Cell} = require('./xLib');

class xRow extends Row {

    newCell(cellModel, options) {
        let {wtcolx} = options;
        let cell = this.getCell(wtcolx);
        cell.style = cellModel.style;
        let v;
        if ( cellModel.type === Cell.Types.Null) {
            return
        } else if (cellModel.type === Cell.Types.Merge) {
            return
        } else {
            v = cellModel.value !== undefined ? cellModel.value : cellModel;
        }
        cell.value = v;
        //cell.model = cellModel;
        //No set model(), there is a bug causes rich text to be lost
    };
    
    setModel(rowModel) {
        this._cells = [];
        if (rowModel.height) {
            this.height = rowModel.height;
        } else {
            delete this.height;
        }      
        this.hidden = rowModel.hidden;
        this.outlineLevel = rowModel.outlineLevel || 0;
        this.style = (rowModel.style && JSON.parse(JSON.stringify(rowModel.style))) || {};
    }
}

module.exports = xRow;
