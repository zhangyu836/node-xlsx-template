let {RichText} = require('../richtext')

class RichTextExceljs extends RichText{

    getTextOfRun(run) {
        return run.text;
    }

    unpackRun(run) {
        return run;
    }

    packRun(text, font) {
        return {text, font};
    }
}

module.exports = {RichTextExceljs}
