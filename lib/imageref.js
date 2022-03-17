const fs = require('fs');
// from xlsx.js of exceljs
function fsReadFileAsync(filename, options) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, options, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

function getExtension(filepath) {
    //let name = filepath.split('\\').pop().split('/').pop();
    return filepath.split('.').pop();
}

class ImageRef {
    constructor(imageRef, imageNo) {
        if(!imageNo){
            imageNo = 0;
        }
        this.imageRef = imageRef;
        this.imageNo = imageNo;
        this.rdRow = 0;
        this.rdCol = 0;
        this.wtRow = 0;
        this.wtCol = 0;
    }

    get wtTopLeft() {
        return [this.wtRow, this.wtCol]
    }

    get mergeKey() {
        return [this.rdRow, this.rdCol, this.imageNo]
    }

    get image() {
        if(!this.imageRef) {
            return;
        }
        if(typeof this.imageRef==="string") {
            let extension = getExtension(this.imageRef);
            return {filename:this.imageRef, extension};
        }
        if (this.imageRef.filename || this.imageRef.buffer || this.imageRef.base64) {
            return this.imageRef;
        }
        console.log(this.imageRef);
        throw new Error('Unsupported media');
    }
}

module.exports = {ImageRef, getExtension, fsReadFileAsync};
