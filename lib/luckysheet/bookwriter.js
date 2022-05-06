let {SheetWriterMap} = require('./sheetwriter');
let {SheetResourceMap} = require('./sheetresource');
let {BookModel} = require('./bookmodel');

class BookWriter {
    constructor(bookModel) {
        this.bookModel = new BookModel(bookModel);
        this.sheetWriterMap = new SheetWriterMap(this);
        this.sheetResourceMap = new SheetResourceMap(this);
    }

    getSheetName(context) {
        let sheetName = context["sheetName"] || context["sheet_name"];
        if (sheetName){
            return sheetName;
        }
        for(let i = 0; i < 9999; i++) {
            sheetName = `sheet${i}`;
            if(!this.sheetWriterMap.hasName(sheetName)) {
                return sheetName;
            }
        }
        return "XLSheet";
    }

    renderSheet(context) {
        let sheetResource = this.sheetResourceMap.getSheetResource(context);
        let sheetName = this.getSheetName(context);
        let sheetWriter = this.sheetWriterMap.getSheetWriter(sheetResource, sheetName);
        sheetResource.renderSheet(sheetWriter, context);
    }

    renderSheets(contexts) {
        contexts.forEach(context=> {
            this.renderSheet(context);
        })
    }
}

module.exports = BookWriter;
