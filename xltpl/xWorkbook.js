let {Workbook} = require('./xLib'); 
let xWorksheet = require('./xWorksheet'); 


class xWorkbook extends Workbook {

    setModel(bookModel) {
        this.creator = bookModel.creator;
        this.lastModifiedBy = bookModel.lastModifiedBy;
        this.lastPrinted = bookModel.lastPrinted;
        this.created = bookModel.created;
        this.modified = bookModel.modified;
        this.company = bookModel.company;
        this.manager = bookModel.manager;
        this.title = bookModel.title;
        this.subject = bookModel.subject;
        this.keywords = bookModel.keywords;
        this.category = bookModel.category;
        this.description = bookModel.description;
        this.language = bookModel.language;
        this.revision = bookModel.revision;
        this.contentStatus = bookModel.contentStatus;
    
        this.properties = bookModel.properties;
        this._worksheets = [];
        
        this._definedNames.model = bookModel.definedNames;
        this.views = bookModel.views;
        this._themes = bookModel.themes;
        this.media = bookModel.media || [];
        this.orderNo = 0;
        this.defaultFont = bookModel.defaultFont;
    }

    newWorksheet(sheetModel, options) {
        let {sheetName, state} = options;
        let orderNo = ++this.orderNo;
        let worksheet = (this._worksheets[orderNo] = new xWorksheet({
            id: orderNo,
            name: sheetName,
            orderNo,
            state,
            workbook: this,
        }));      
        worksheet.setModel(sheetModel);
        worksheet.rangeAlreadySet = {};
        return worksheet;
    }

}

module.exports = xWorkbook;