
let FixTest = RegExp('({(?:___\\d+___)?[{%].+?[}%](?:___\\d+___)?})');
let RunSplit = RegExp('(___\\d+___)');
let RunSplit2 = RegExp('___(\\d+)___');

function fixTest(text){
    let parts = text.split(FixTest);
    for (let i=1; i<parts.length; i+=2){
        let part = parts[i];
        let m = part.match(RunSplit);
        if (m) {
            return true;
        }
    }
}

function tagFix(text) {
    let parts = text.split(FixTest);
    let p = '';
    for (let i=0; i<parts.length; i++){
        let part = parts[i];
        if (i % 2 === 1){
            p += fixStep2(part);
        } else {
            p += part;
        }
    }
    let d = {};
    parts = p.split(RunSplit2);
    for (let i=1; i<parts.length; i+=2) {
        d[Number(parts[i])] = parts[i + 1];
    }
    return d;
}

function fixStep2(text) {
    let parts = text.split(RunSplit);
    let p0 = ''
    let p1 = ''
    for (let i=0; i<parts.length; i++) {
        let part = parts[i];
        if (i % 2 === 0) {
            p0 += part;
        } else {
            p1 += part
        }
    }
    return p0+p1
}

class RichText {
    constructor(richText) {
        this.richText = richText;
    }

    get text() {
        return this.richText.map(t => t.text).join('');
    }

    chop(head, tail) {
        let st = 0
        let end = -1
        let runs = []
        //let texts = []
        for (let run of this.richText) {
            let text = run.text;
            let font = run.font;
            st = end + 1;
            end += text.length;
            if (end < head) {
                //continue
            } else if (st <= head && head <= end) {
                if (end < tail) {
                    let textSt = head - st;
                    text = text.slice(textSt);
                    runs.push({text, font});
                    //texts.push(text);
                } else {
                    let textSt = head - st;
                    let textEnd = tail - st;
                    text = text.slice(textSt, textEnd + 1);
                    runs.push({text, font});
                    //texts.push(text);
                    break;
                }
            } else if (end < tail) {
                runs.push({text, font});
                //texts.push(text);
            } else {
                let textEnd = tail - st
                text = text.slice(0, textEnd + 1);
                runs.push({text, font});
                //texts.push(text);
                break;
            }
        }
        this.richText = runs;
    }

    text4Fix() {
        let text = [];
        for(let i=0; i<this.richText.length; i++){
            let run = this.richText[i];
            text.push(`___${i}___`);
            text.push(run.text);
        }
        return text.join('');
    }

    getRuns() {
        let text4Fix = this.text4Fix();
        if(fixTest(text4Fix)) {
            let runs = [];
            let fixed = tagFix(text4Fix)
            for (let i = 0; i < this.richText.length; i++) {
                let text = fixed[i];
                if (text){
                    let run = this.richText[i];
                    runs.push({text, font:run.font});
                }
            }
            return runs;
        } else {
            return this.richText;
        }
    }
}

module.exports = {RichText}
