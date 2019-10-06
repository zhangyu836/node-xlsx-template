

function RowExtension() {
    this.tags = ['row'];

    this.parse = function(parser, nodes, _lexer) {
        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, 'run', args, []);
    };

    this.run = function(context, number) {
        let rootSheet = context.env.getGlobal('rootSheet'); 
        let row = rootSheet.getNode(number);
        row.handleRv();
        return 'row ${number}';
    };
}

function CellExtension() {
    this.tags = ['cell'];

    this.parse = function(parser, nodes, _lexer) {

        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        let body = parser.parseUntilBlocks('endcell');        
        parser.advanceAfterBlockEnd();
        return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function(context, number, body) {
        let rootSheet = context.env.getGlobal('rootSheet'); 
        let cell = rootSheet.getNode(number);
        let rv = body();
        cell.handleRv(rv);
        return 'cell ${number}';
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

    this.run = function(context, xv) {
        let rootSheet = context.env.getGlobal('rootSheet');
        rootSheet.currentNode.handleXv(xv);
        return xv;
    };
}

function SectionExtension() {
    this.tags = ['sec'];

    this.parse = function(parser, nodes, _lexer) {

        let tok = parser.nextToken();
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        let body = parser.parseUntilBlocks('endsec');        
        parser.advanceAfterBlockEnd();
        return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function(context, number, body) {
        let rootSheet = context.env.getGlobal('rootSheet'); 
        let tagSection = rootSheet.getSection(number);
        let rv = body();
        return tagSection.handleRv(rv);
    };
}

module.exports = {RowExtension, CellExtension, XvExtension, SectionExtension};

