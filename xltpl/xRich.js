let {reSv} = require('./xUtil');

class Section {
    constructor(parent, section, key) {
        this.parent = parent;
        this.section = section;
        this.key = key;
    }

    toTag() {
        return this.key;
    }
}

class TagSection {
    constructor(parent, el) {
        this.parent = parent;
        this.text = el.text;
        this.font = el.font;
    }

    toTag() {
        return `{% sec ${this.number} %}${this.text}{% endsec %}`
    }

    handleRv(rv) {        
        if(rv.length > 0) {
            let el = {text: rv, font: this.font};
            return this.parent.addV(el);
        } else {
            return '';
        }
    }
}

function containTag(richText) {
    return richText.some(el => {
        return reSv.test(el.text);
    });
}

class RichText {
    constructor(parent, richText) {
        this.parent = parent;
        this.richText = richText;
        this.kvMap = new Map();
        this.sectionKeys = new Set();
        this.sections = [];
        this.toSections();
    }

    toString() {
        return this.richText.map(t => t.text).join('');
    }

    addV(value) {
        if( typeof value === 'string') {
            return value;
        }
        let key = `__${this.kvMap.size}__`;
        this.kvMap.set(key, value);
        return key;
    }

    addChild(child) {
        child.number = this.sections.length;
        this.sections.push(child);
    }

    addSection(sec) {
        let key = this.addV(sec);
        this.sectionKeys.add(key);
        let section = new Section(this, sec, key);
        this.addChild(section);
    }

    addTagSection(el) {
        let ts = new TagSection(this, el);
        this.addChild(ts);
    }

    getSection(number) {
        return this.sections[number];
    }

    toSections() {
        let sec = [];
        this.richText.forEach(el => {
            if(reSv.test(el.text)) {
                if (sec.length > 0) {
                    this.addSection(sec);
                    sec = [];
                };
                this.addTagSection(el);
            } else {
                sec.push(el);
            }
        });
        if (sec.length > 0) {
            this.addSection(sec);
        };
    }

    toTag() {
        return this.sections.map(s => s.toTag()).join('');
    }

    resetKvMap() {
        for(let key of this.kvMap.keys()) {
            if(!this.sectionKeys.has(key)) {
                this.kvMap.delete(key);
            }
        }
    }

    handleRv(rv) {
        let pattern = /(__\d+__)/;
        let keys = rv.split(pattern);
        let rich = [];
        keys.forEach(key => {
            if(key === "") {
                return
            }
            let sec = this.kvMap.get(key);
            if(Array.isArray(sec)) {
                rich = rich.concat(sec);
            } else {
                rich.push(sec);
            }
        });
        this.resetKvMap();
        return rich;
    }
}

module.exports = {RichText, containTag};
