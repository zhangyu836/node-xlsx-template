let {Cell} = require('./exceljslib');
let {findCellTag, reTag, reBlock, isVariableNoSpace, isXv, imgSplit, blockSplit } = require('./celltag');
let {XNode} = require('./node');
let {RichText} = require('./richtext')

class CellNode extends XNode {

    constructor(model, row, col) {
        super();
        this.extTag = "cell";
        this.model = model;
        this.row = row;
        this.col = col;
        this.cellTag = null;
        this.rv = null;
    }

    toTag() {
        let tag = super.toTag();
        if(this.cellTag){
            return this.cellTag.beforecell + tag + this.cellTag.aftercell;
        }
        return tag;
    }

    get nodeKey() {
        if(this.model){
            return `${this._parent.nodeKey},${this.model.address}`;
        }
        return super.nodeKey;
    }

    writeCell(){
        this._parent.writeCell(this);
    }

    exit() {
        this.writeCell();
    }

    setImageRef(imageRef) {
        imageRef.rdRow = this.row;
        imageRef.rdCol = this.col;
        this._parent.setImageRef(imageRef);
    }
}

class XvCell extends CellNode {
    constructor(model, row, col, text, isXv) {
        super(model, row, col);
        this.text = text;
        this.isXv = isXv;
    }

    get nodeTag() {
        let _var = this.text.trim().slice(2,-2);
        if(this.isXv) {
            _var = _var.slice(2).trim();
        }
        return `{%xv "${this.nodeKey}",${_var} %}`;
    }

    enter() {
        this.rv = null;
    }
}
class Segment extends XNode {
    constructor(text) {
        super();
        this.text = text;
    }

    get nodeTag() {
        function replacer(match,p0,p1,p2){
            return '{{' + p1 + '}}';
        }
        let xvPattern = RegExp('({% *xv)(.+?)(%})');
        let text = this.text;
        while(text.match(xvPattern)){
            text = text.replace(RegExp(xvPattern), replacer);
        }
        return `{%seg "${this.nodeKey}" %}${text}{%endseg%}`;
    }

    processRv(rv) {
        this._parent.processChildRv(rv);
    }
}

class BlockSegment extends Segment {

    get nodeTag() {
        return this.text;
    }
}

class ImageSegment extends Segment {

    get nodeTag() {
        return `{%seg "${this.nodeKey}" %}{%endseg%}${this.text}`;
    }
}

class Section extends XNode {

    constructor(text, font, isRich) {
        super();
        this.text = text;
        this.font = font;
        this.isRich = isRich;
        this.unpack(text);
    }

    unpack(text) {
        let parts = text.split(blockSplit);
        for(let index=0; index<parts.length; index++){
            let part = parts[index];
            if (part === '') {
                continue;
            }
            let child;
            if (index % 2 === 0) {
                let subParts = part.split(imgSplit);
                for(let subIndex=0; subIndex<subParts.length; subIndex++){
                    let subPart = subParts[subIndex];
                    if (subPart === '') {
                        continue;
                    }
                    if (subIndex % 2 === 0) {
                        child = new Segment(subPart);
                    } else {
                        child = new ImageSegment(subPart);
                    }
                    this.addChild(child);
                }
            } else {
                child = new BlockSegment(part);
                this.addChild(child);
            }
        }
    }

    pack() {
        let text = this.childRvs.join('');
        if(this.isRich){
            return {text, font:this.font};
        }
        return text;
    }

    processChildRv(rv) {
        this.childRvs.push(rv);
    }

    enter() {
        this.childRvs = [];
    }

    exit() {
        let rv = this.pack();
        this._parent.processChildRv(rv);
    }
}

class TagCell extends CellNode {
    constructor(model, row, col, text) {
        super(model, row, col);
        let section = new Section(text, null , false);
        this.addChild(section);
    }

    processChildRv(rv) {
        this.rv = rv;
    }
}

class RichTagCell extends CellNode {
    constructor(model, row, col, richText) {
        super(model, row, col);
        let runs = richText.getRuns();
        for(let i=0; i<runs.length; i++){
            let run = runs[i];
            let section = new Section(run.text, run.font, true);
            this.addChild(section);
        }
    }

    enter() {
        this.rv = [];

    }

    processChildRv(rv) {
        this.rv.push(rv);
    }
}

function getCellNode(cellModel, row, col) {
    let cellNode, cellTag;
    if(cellModel && (cellModel.type === Cell.Types.String ||
        cellModel.type === Cell.Types.RichText)) {
        let text, rich;
        if(cellModel.type === Cell.Types.String){
            text = cellModel.value;
        } else {
            rich = new RichText(cellModel.value.richText);
            text = rich.text;
        }
        if(reTag.test(text)) {
            if(reBlock.test(text)){
                let ret = findCellTag(text);
                if (ret.cellTag){
                    cellTag = ret.cellTag;
                    text = ret.text;
                    if(rich) {
                        rich.chop(ret.head, ret.head2tail);
                    }
                }
            }
            if(text==="") {
                cellModel.value = "";
            } else if(isVariableNoSpace(text)){
                cellNode = new XvCell(cellModel, row, col, text, false);
            } else if(isXv(text)) {
                cellNode = new XvCell(cellModel, row, col, text,true);
            } else if(reTag.test(text)){
                if(rich){
                    cellNode = new RichTagCell(cellModel, row, col, rich);
                } else {
                    cellNode = new TagCell(cellModel, row, col, text);
                }
            } else {
                if(cellTag){
                    if(rich){
                        cellModel.value = rich;
                    } else {
                        cellModel.value = text;
                    }
                }
            }
        }
    }
    if (!cellNode) {
        cellNode = new CellNode(cellModel, row, col);
    }
    if (cellTag) {
        cellNode.cellTag = cellTag;
    }
    return cellNode
}

module.exports = {getCellNode}
