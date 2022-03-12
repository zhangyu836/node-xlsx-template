
class NodeMap {
    constructor() {
        this.currentNode = null;
        this.currentKey = '';
        this.lastNode = null;
        //this.lastKey = null;
        this.nodeMap = new Map();
    }

    setCurrentNode(node) {
        this.currentNode = node;
        this.currentKey = node.nodeKey;
    }

    put(key, node) {
        this.nodeMap.set(key, node);
    }

    clear() {
        this.nodeMap.clear();
    }

    findLca(pre, next) {
        //find lowest common ancestor
        let nextBranch = [];
        let preDepth = pre.depth;
        let nextDepth = next.depth;
        if (preDepth > nextDepth) {
            for (let i = nextDepth; i < preDepth; i++) {
                pre.exit();
                pre = pre._parent;
            }
        } else if (preDepth < nextDepth) {
            for (let i = preDepth; i < nextDepth; i++) {
                nextBranch.push(next);
                next = next._parent;
            }
        }
        if (pre === next) {
        } else {
            let preParent = pre._parent;
            let nextParent = next._parent;
            while (preParent !== nextParent) {
                pre.exit();
                pre = preParent;
                preParent = pre._parent;
                nextBranch.push(next);
                next = nextParent;
                nextParent = next._parent;
            }
            pre.exit();
            if (preParent._children.indexOf(pre) > preParent._children.indexOf(next)) {
                preParent.childReenter()
                next.reenter()
            } else {
                next.enter()
            }
        }
        next = nextBranch.pop();
        while (next) {
            next.enter();
            next = nextBranch.pop();
        }
    }

    getNode(key) {
        if (key === this.currentKey) {
            return this.currentNode;
        } else {
            //this.lastKey = this.currentKey;
            this.lastNode = this.currentNode;
            this.currentNode = this.nodeMap.get(key);
            this.currentKey = key;
            this.findLca(this.lastNode, this.currentNode);
        }
        return this.currentNode;

    }

    getTagNode(key) {
        return this.nodeMap.get(key);
    }
}

module.exports = {NodeMap}
