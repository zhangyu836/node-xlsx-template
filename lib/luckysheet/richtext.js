let {RichText} = require('../richtext')

class RichTextLuckySheet extends RichText{

    getTextOfRun(run) {
        return run.v;
    }

    unpackRun(run) {
        return {text:run.v, font:run};
    }

    packRun(text, font) {
        let target = Object.assign({}, font);
        target.v = text;
        return target;
    }
}

module.exports = {RichTextLuckySheet}
