

class machine {
    constructor(id,debug=true,active=false,parent=null) {
        console.log('genarate new machine... id:', id);
        this.debug = debug;
        this.active = active;
        this.parent = parent;
    }

    debug;
    active;
    parent;
    id2metafilename(id) { }
    id2objfilename(id) { }
    init(id) { }
    save(obj) { }
    load(id) { }
    log(obj, content) { }
    joint(id1, id2, termid) { }
    split(obj, data) { }
}

export { machine };