let {ImageRef} = require('./imageref');

function NodeExtension() {
    this.tags = ['row', 'node', 'cell', 'root'];

    this.parse = function(parser, nodes, _lexer) {
        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, 'run', args, []);
    };

    this.run = function(context, key) {
        let nodeMap = context.env.nodeMap;
        nodeMap.getNode(key);
        return 'node';
    };
}

function XvExtension() {
    this.tags = ['xv'];

    this.parse = function(parser, nodes, _lexer) {
        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, 'run', args, []);
    };

    this.run = function(context, key, xv) {
        let nodeMap = context.env.nodeMap;
        let cell = nodeMap.getNode(key);
        if(!xv) {
            xv = ''
        }
        cell.rv = xv;
        return 'xv';
    };
}

function SegmentExtension() {
    this.tags = ['seg'];

    this.parse = function(parser, nodes, _lexer) {
        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        let body = parser.parseUntilBlocks('endseg');
        parser.advanceAfterBlockEnd();
        return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function(context, key, body) {
        let nodeMap = context.env.nodeMap;
        let seg = nodeMap.getNode(key);
        let rv = body();
        seg.processRv(rv);
        return 'seg';
    };
}

function ImageExtension() {
    this.tags = ['img'];

    this.parse = function(parser, nodes, _lexer) {
        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, 'run', args, []);
    };

    this.run = function(context, img, imgNo) {
        let ref = new ImageRef(img, imgNo);
        if(! ref.image) {
            return 'no image ref';
        }
        let nodeMap = context.env.nodeMap;
        let node = nodeMap.currentNode;
        node.setImageRef(ref);
        return 'img';
    };
}

module.exports = {NodeExtension, XvExtension, SegmentExtension, ImageExtension};
