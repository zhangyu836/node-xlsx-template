let {Xlsx, Workbook, colCache, Column } = require('./exceljslib');
let {Root, RowNode, XNode} = require('./node');
let {getCellNode} = require('./cellnode');
let {SheetResourceMap} = require('./sheetresource');
let {SheetWriterMap} = require('./sheetwriter');

class Book extends Workbook {

    constructor() {
        super();
        this.xltpl = "xltpl";
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

    build(worksheet, nodeMap, merger) {
        let cellModels = {};
        let rowModels = [];
        let {maxRow, maxCol} = merger.imageMerger;
        worksheet.rows.forEach(rowModel => {
            rowModels[rowModel.number] = rowModel;
            rowModel.cells.forEach(cellModel => {
                let {row,col} = colCache.decodeAddress(cellModel.address);
                cellModels[[row, col]] = cellModel;
                maxRow = Math.max(maxRow, row);
                maxCol = Math.max(maxCol, col);
            });
        });

        worksheet.columns = Column.fromModel(worksheet, worksheet.cols);

        let root = new Root(worksheet.sheetNo, nodeMap);
        for(let r = 1; r <= maxRow; r++) {
            let rowModel = rowModels[r];
            let rowNode = new RowNode(rowModel);
            root.addChild(rowNode);
            if(rowModel){
                for(let c = 1; c <= maxCol; c++) {
                    let cellModel = cellModels[[r,c]];
                    let cellNode = getCellNode(cellModel, r, c);
                    root.addChild(cellNode);
                    if (c===1 && cellNode.cellTag && cellNode.cellTag.beforerow) {
                        rowNode.cellTag = cellNode.cellTag;
                    }
                }
            }
        }
        root.addChild(new XNode());
        return root;
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
    getSheetName(payload) {
        let sheetName = payload["sheetName"] || payload["sheet_name"];
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
        this.workbook = new Book();
        this.workbook.copyModel(this.bookModel);
    }

    renderSheet(payload) {
        this.createXltplBook();
        let sheetResource = this.sheetResourceMap.getSheetResource(payload);
        let sheetName = this.getSheetName(payload);
        let sheetWriter = this.sheetWriterMap.getSheetWriter(sheetResource, sheetName);
        sheetResource.renderSheet(sheetWriter, payload);
    }

    renderSheets(payloads) {
        payloads.forEach(payload=> {
            this.renderSheet(payload);
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
