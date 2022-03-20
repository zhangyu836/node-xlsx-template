
let patternTag = "{%.+%}|{{.+}}";
let patternXv = "^ *{% *xv.+%} *$";
let patternVariable = "{{.+}}";
let patternVariableNoSpace = "^{{.+}}$";
let patternBlock = "{%.+%}";
let reTag = RegExp(patternTag);
let reXv = RegExp(patternXv);
let reVariable = RegExp(patternVariable);
let reVariableNoSpace = RegExp(patternVariableNoSpace);
let reBlock = RegExp(patternBlock);

let exclude = " *xv | *img "
let imgExclude = " *img "
let beforeCell = RegExp(`^({%(?!${exclude}).+?%})+`);
let afterCell = RegExp(`({%(?!${exclude}).+?%})+$`);
let beforeRow = RegExp(`^({%-(?!${exclude}).+?%})+`);
let extraCell = RegExp(`({%\\\+(?!${exclude}).+?%})+$`);
let blockSplit = RegExp(`((?:{%(?:(?!${exclude}).)+?%})+)`);
let imgSplit = RegExp(`({%(?:(?=${imgExclude})).+?%})`);

class CellTag {
    constructor() {
        this.beforerow = '';
        this.beforecell = '';
        this.aftercell = '';
        this.extracell = '';
    }
}

function findTag(pattern, text){
    let m = text.match(pattern);
    let tag, _text;
    if(m) {
        [tag,] = m;
        if(m.index===0){
            _text = text.slice(tag.length);
        } else {
            _text = text.slice(0, m.index);
        }
        return {text:_text, tag, len:tag.length};
    }
    return {text, tag:"", len:0};
}

function findCellTag(text) {
    let head = 0;
    let tail = 0;
    let cellTag = new CellTag();
    let ret = findTag(beforeRow, text);
    cellTag.beforerow = ret.tag;
    head += ret.len;
    ret = findTag(beforeCell, ret.text);
    cellTag.beforecell = ret.tag;
    head += ret.len;
    ret = findTag(extraCell, ret.text);
    cellTag.extracell = ret.tag;
    tail += ret.len;
    ret = findTag(afterCell, ret.text);
    cellTag.aftercell = ret.tag;
    tail += ret.len;
    if (head>0 || tail>0) {
        return {text:ret.text, cellTag, head, tail, head2tail:head+ret.text.length-1};
    }
    return {text, cellTag:null, head, tail};
}

let singleVariable = "{{.+?}}";
let reSingleVariable = RegExp(singleVariable);
function isVariableNoSpace(text){
    if(reVariableNoSpace.test(text)){
        if (text.split(reSingleVariable).length===2) return true;
    }
}

let singleXv = "{% *xv.+?%}";
let reSingleXv = RegExp(singleXv);
function isXv(text){
    if(reXv.test(text)){
        if (text.split(reSingleXv).length===2) return true;
    }
}

module.exports = {CellTag, findCellTag, reTag, reXv, reVariable,
    isVariableNoSpace, isXv, reBlock, imgSplit, blockSplit}
