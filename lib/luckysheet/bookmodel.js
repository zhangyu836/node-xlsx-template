

class BookModel {
    constructor(luckySheet) {
        this.luckySheet = luckySheet;
    }

    addSheet(sheetModel, sheetName) {
        let sheetObject = this.getSheetObject(sheetName);
        this.luckySheet.setSheetAdd({sheetObject});// no return value
        return this.luckySheet.getSheet({name:sheetName});
    }

    getSheet(name, order) {
        let sheetModel;
        if(name != null){
            sheetModel = this.luckySheet.getSheet({name});
        }
        if (!sheetModel) {
            if(order != null){
                sheetModel = this.luckySheet.getSheet({order});
            }
        }
        //console.log(sheetModel, 'getSheetModel by order');
        if (!sheetModel) {
            sheetModel = this.luckySheet.getSheet();
        }
        return sheetModel;
    }

    getBorderInfo(index) {
        return this.luckySheet.getBorderInfoCompute(index);
    }

    getSheetObject(sheetName) {
        let sheet = {
            "name": sheetName,
            //"order": null, //工作表的下标
            //"celldata": [],
            //"data": [],
            "config": {
                "merge": {}, //合并单元格
                "rowlen": {}, //表格行高
                "columnlen": {}, //表格列宽
                "rowhidden": {}, //隐藏行
                "colhidden": {}, //隐藏列
                "borderInfo": [], //边框
                "authority": {}, //工作表保护

            },
            "luckysheet_select_save": [], //选中的区域
            "calcChain": [],//公式链
            "pivotTable": {},//数据透视表设置
            "filter_select": {},//筛选范围
            "filter": null,//筛选配置
            "luckysheet_alternateformat_save": [], //交替颜色
            "luckysheet_alternateformat_save_modelCustom": [], //自定义交替颜色
            "luckysheet_conditionformat_save": {},//条件格式
            "frozen": {}, //冻结行列配置
            "chart": [], //图表配置
            "image": [], //图片
            "dataVerification": {} //数据验证配置
        }
        return sheet;
        //let sheetObject = Object.assign({}, this.rdSheet, sheet);
        //delete sheetObject["data"];
        //return sheetObject;
    }

    setRowHeight(rowInfo, order){
        this.luckySheet.setRowHeight(rowInfo, {order});
    }

    hideRow(wtRowx, order){
        this.luckySheet.hideRow(wtRowx, wtRowx, {order});
    }

    setColumnWidth(colInfo, order){
        this.luckySheet.setColumnWidth(colInfo, {order});
    }

    hideColumn(wtColx, order) {
        this.luckySheet.hideColumn(wtColx, wtColx, {order});
    }

    setCellValue(rowx, colx, wtCell, order){
        this.luckySheet.setCellValue(rowx, colx, wtCell, {order});
    }

    setRangeMerge(range, order) {
        this.luckySheet.setRangeMerge('all', {range,order})
    }
}

module.exports = {BookModel}
