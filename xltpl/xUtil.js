let BLOCK_START = '{%';
let BLOCK_END = '%}';
let VARIABLE_START = '{{';
let VARIABLE_END = '}}';
let patternSv = `${BLOCK_START}.+${BLOCK_END}|${VARIABLE_START}.+${VARIABLE_END}`;
let patternXv = `^ *${BLOCK_START} *xv.+${BLOCK_END} *$`;
let reSv = RegExp(patternSv);
let reXv = RegExp(patternXv);

let delimiters = ['beforerow', 'beforecell', 'aftercell']
let patternD = `(${delimiters.join('|')})`;
let reD = RegExp(patternD);

function parseTag(txt) {
    if (!txt || !reSv.test(txt)) {
        return {};
    }
    let parts = txt.split(reD);
    let dict = {};
    for(let i = 1; i < parts.length; i += 2) {
        if (reSv.test(parts[i + 1]) ) {
            dict[parts[i]] = parts[i + 1];
        }
    }
    return dict
}

module.exports = {reSv, reXv, parseTag}