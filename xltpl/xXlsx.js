let {Xlsx, colCache } = require('./xLib');
let xWorkbook = require('./xWorkbook');
let {parseTag} = require('./xUtil');
let {xlSheet, xlRow, xlCell, xlTag} = require('./xNode');
let {RowExtension, CellExtension, XvExtension, SectionExtension} = require('./xExt');
let nunjucks = require("nunjucks");


class xXlsx extends Xlsx {

    constructor() {
        super({});
    }

    reconcile(model, options) {
        let sheetModels = [];
        model.worksheets.forEach(worksheet => {
            sheetModels[worksheet.sheetNo - 1] = worksheet;
            this.getCells(worksheet);
            this.getComments(model, worksheet);
            this.getMerges(worksheet);
        });
        this.xSheetModels = sheetModels;
        this.xBookModel = model;
        //this.defaultFont = model.styles.model.fonts[0];
        super.reconcile(model, options);
    }

    getCells(worksheet) {
        let cellModels = {};
        let rowModels = [];
        worksheet.rows.forEach(rowModel => {
            rowModels[rowModel.number] = rowModel;
            rowModel.cells.forEach(cellModel => {
                let address = colCache.decodeAddress(cellModel.address);
                cellModels[[address.row, address.col]] = cellModel;
            });
        });
        worksheet.xDimensions = colCache.decodeEx(worksheet.dimensions);
        worksheet.xRowModels = rowModels;
        worksheet.xCellModels = cellModels;
    }

    getComments(model, worksheet) {
        let relationships = model.worksheetRels[worksheet.sheetNo];
        let cellComments;
        relationships.forEach( rel => {
            if (rel.Type == Xlsx.RelType.Comments) {
                cellComments = model.comments[rel.Target].comments;
            }
        });

        let comments = {};
        cellComments.forEach(comment => {
            if (comment.ref) {
                let address = colCache.decodeAddress(comment.ref);
                let commentText = comment.texts.map(t => t.text).join('');
                comments[[address.row, address.col]] = commentText;
            }
        });
        worksheet.xComments = comments;
    }

    getMerges(worksheet) {
        let mcTopLeft = {};
        let mcAlreadySet = {};        
        if (!worksheet.mergeCells) {
            return
        }
        worksheet.mergeCells.forEach(mergeCell => {
            let {top, left, bottom, right} = colCache.decodeEx(mergeCell);
            mcTopLeft[[top, left]] = [top, left];
            for (let i = top; i <= bottom; i++) {
                for (let j = left; j <= right; j++) {
                    mcAlreadySet[[i, j]] = [top, left];
                }
            }
        });
        worksheet.mcTopLeft = mcTopLeft;
        worksheet.mcAlreadySet = mcAlreadySet;        
    }


    newWorkbook() {
        this.workbook = new xWorkbook();
        this.workbook.setModel(this.xBookModel);
    }


    newWorksheet(sheet, options) {
        return this.workbook.newWorksheet(sheet, options);
    }

    setEnv() {
        let env = new nunjucks.Environment();
        env.addExtension('RowExtension', new RowExtension());
        env.addExtension('CellExtension', new CellExtension());
        env.addExtension('XvExtension', new XvExtension());
        env.addExtension('SectionExtension', new SectionExtension());
        this.env = env;
    }

    loadTpl(sheetModel) {
        let {right, bottom} = sheetModel.xDimensions;
        let rootSheet = new xlSheet(sheetModel);
        for(let r = 1; r <= bottom; r++) {            
            for(let c = 1; c <= right; c++) {
                let comment = sheetModel.xComments[[r,c]];
                let tags = parseTag(comment);
                if (c==1) {
                    let beforerow = tags['beforerow'];
                    if(beforerow) {
                        let tag = new xlTag(rootSheet, beforerow);
                        rootSheet.addNode(tag);
                    }
                    let rowModel = sheetModel.xRowModels[r];
                    let row = new xlRow(rootSheet, rowModel, r);
                    rootSheet.addNode(row);
                    if(!rowModel) {
                        break;
                    };
                }
                let beforecell = tags['beforecell'];
                if(beforecell) {
                    let tag = new xlTag(rootSheet, beforecell);
                    rootSheet.addNode(tag);
                }
                let cellModel = sheetModel.xCellModels[[r,c]];
                let cell = new xlCell(rootSheet, cellModel, r, c, c==right);
                rootSheet.addNode(cell);
                let aftercell = tags['aftercell'];
                if(aftercell) {
                    let tag = new xlTag(rootSheet, aftercell);
                    rootSheet.addNode(tag);
                }
            };
        };
        //console.log(rootSheet.toTag());
        let njTpl = nunjucks.compile(rootSheet.toTag(), this.env);
        let tpl = {rootSheet, njTpl};
        this.xSheetTplList.push(tpl);
        this.xSheetTplMap[sheetModel.name] = tpl;
    }

    async load(fileName) {
        await this.readFile(fileName);
        this.setEnv();
        this.xSheetTplList = [];
        this.xSheetTplMap = {};
        this.xSheetModels.forEach(sheetModel => {
            this.loadTpl(sheetModel);
        })
    }

    getTpl(payload) {
        let {sheetTplName, sheetTplIndex } = payload;
        let tpl;
        if(sheetTplName) {
            tpl = this.xSheetTplMap[sheetTplName];
        } else {
            tpl = this.xSheetTplList[sheetTplIndex];
        };
        if(!tpl) {
            tpl = this.xSheetTplList[0];
        };
        return tpl;
    }

    render(payloads) {
        this.newWorkbook();
        if(!Array.isArray(payloads)) {
            payloads = [payloads];
        }
        payloads.forEach(payload => {
            let {rootSheet, njTpl} = this.getTpl(payload);
            let {sheetName, state} = payload;
            let targetSheet = this.newWorksheet(rootSheet.sheetModel, {sheetName, state});
            rootSheet.targetSheet = targetSheet;
            this.env.addGlobal('rootSheet', rootSheet);
            njTpl.render(payload);
            targetSheet.setMerges();
            rootSheet.reset();
        })
    }

    save(fileName) {
        this.writeFile(fileName);
    }
}

module.exports = xXlsx;
