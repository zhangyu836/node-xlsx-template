let {Xlsx, Workbook} = require('./exceljslib');
let {SheetWriterMap} = require('./sheetwriter');
let {SheetResourceMap} = require('./sheetresource');


class Book extends Workbook {

    constructor(bookModel) {
        super();
        this.xltpl = "xltpl";
        this.copyModel(bookModel)
    }

    copyModel(bookModel) {
        this.bookModel = bookModel;
        this.creator = this.xltpl;//bookModel.creator;
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
        this._definedNames.model = bookModel.definedNames;
        this.views = bookModel.views;
        this.themes = bookModel.themes;
        this.media = [];
        this.defaultFont = bookModel.defaultFont;
        this.imageMap = new Map();
    }

    addImage(image) {
        let key = image.filename || image.buffer || image.base64;
        if(!key) {
            console.log(image);
            throw new Error('Unsupported media');
        }
        let imageId = this.imageMap.get(key);
        if( imageId!=null) {
            return imageId;
        }
        imageId = super.addImage(image);
        this.imageMap.set(key, imageId);
        return imageId;
    }

    addImageFromMedia(imageId) {
        let _imageId = this.imageMap.get(imageId);
        if( _imageId!=null) {
            return _imageId;
        }
        let image = this.bookModel.media[imageId];
        _imageId = super.addImage(image);
        this.imageMap.set(imageId, _imageId);
        return _imageId;
    }
}

class BookWriter extends Xlsx {

    constructor() {
        super({});
        this.sheetWriterMap = new SheetWriterMap(this);
        this.sheetResourceMap = new SheetResourceMap(this);
    }

    loadSheets() {
        this.bookModel = this.workbook.model;
        this.bookModel.worksheets.forEach(sheet => {
            this.sheetResourceMap.addSheet(sheet)
        })
    }

    async load(data, options) {
        await super.load(data, options);
        this.loadSheets();
    }
    //
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

    createXltplBook() {
        if (this.workbook && this.workbook.xltpl) {
            return;
        }
        this.workbook = new Book(this.bookModel);
    }

    renderSheet(context) {
        this.createXltplBook();
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

    clearBook() {
        this.workbook = null;
        this.sheetWriterMap.clear();
    }

    async write(stream, options) {
        await super.write(stream, options);
        this.clearBook();
    }

    async save(fileName) {
        await this.writeFile(fileName);
    }

    prepareModel(model, options) {
        // there is a bug in worksheet-xform.js line: 223+++
        // rId refers to wrong image
        // https://github.com/exceljs/exceljs/issues/1804
        // sort the images by imageId
        model.worksheets.forEach(worksheet => {
            worksheet.media.sort(function (m, n) {
                return m.imageId - n.imageId;
            });
        });
        super.prepareModel(model, options)
    }
}

module.exports = BookWriter;
