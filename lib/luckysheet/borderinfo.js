
class BorderInfo0 {
    constructor(sheetModel) {
        this.toMerge = false;
        let borderInfo = sheetModel.config["borderInfo"];
        //console.log(borderInfo);
        if(!borderInfo){
            return;
        }
        this.borders = {};
        this.addBorders(borderInfo);
    }

    addBorders(borderInfo) {
        for(let border of borderInfo){
            if(border.rangeType==='cell'){
                let {row_index, col_index} = border.value;
                this.borders[[row_index,col_index]] = border.value;
                this.toMerge = true;
            }
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        let borderValue = this.borders[[rdrowx, rdcolx]];
        if(borderValue){
            let value = Object.assign({},borderValue,
                {row_index: wtrowx, col_index: wtcolx})
            return {rangeType: "cell", value}
        }
    }

}

class BorderInfo {
    constructor(borderInfo) {
        this.toMerge = false;
        //let borderInfo = sheetModel.config["borderInfo"];
        //console.log(borderInfo);
        if(!borderInfo){
            return;
        }
        this.borders = {};
        this.addBorders(borderInfo);
    }

    addBorders(borderInfo) {
        for(let key in borderInfo){
            let border = borderInfo[key];
            let [row_index, col_index] = key.split('_');
            this.borders[[row_index,col_index]] = border;
            this.toMerge = true;
        }
    }

    mergeCell(rdrowx, rdcolx, wtrowx, wtcolx) {
        let borderValue = this.borders[[rdrowx, rdcolx]];
        if(borderValue){
            let value = Object.assign({},borderValue,
                {row_index: wtrowx, col_index: wtcolx})
            return {rangeType: "cell", value}
        }
    }

}

module.exports = {BorderInfo};
