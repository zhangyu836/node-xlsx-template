let xXlsx = require('../xltpl/xXlsx');
let HrStopwatch = require('./hr-stopwatch');
let path = require('path');

let scores = [];
let min = 5;
let max = 9;
for (let i = 0; i < 12; i++) {
    let score = [];
    for (let j = 0; j < 12; j++) {
        score[j] = Math.random() * (max - min + 1) + min;
    }
    scores.push(score);
}

var payload0 = {sheetTplName: 'cn', sheetName: 'cn',
float: "333.45", name: "龙傲天", 
address: '福建行中书省福宁州傲龙山庄', date: new Date(),
rows: [0, 1, 2, 1, 2]
};

var payload1 = {sheetTplName: 'en', sheetName: 'en',
float: "333.45", name: "hello wizard", 
address: 'somewhere over the rainbow', date: new Date(),
rows: scores
};

var payload2 = {sheetTplIndex: 2, sheetName: 'scores', 
name: "hello wizard", address: 'somewhere over the rainbow', 
rows: scores, date: new Date(), 
link: {text: 'Bing', hyperlink: 'http://www.bing.com', },  };

var payload3 = {sheetTplName: 'cn', name: "hello wizard 2", 
address: 'somewhere over the rainbow 2', rows: [0, 1, 2, 1, 2]};

var payload4 = {sheetTplName: 'en', name: "hello wizard 3", 
address: 'somewhere over the rainbow 3', };

var payload5 = {name: "hello wizard 4", 
address: 'somewhere over the rainbow 4', };


var payloads = [payload0, payload1, payload2, payload3, payload4, payload5]

var payloads2 = [payload5, payload4, payload3, payload2, payload1, payload0]



async function f() {
    const stopwatch = new HrStopwatch();
    stopwatch.start();  
    let xlsx = new xXlsx();
    await xlsx.load(path.join(__dirname, "test.xlsx"));    
    console.log('load Time:', stopwatch.microseconds);
    stopwatch.start();  
    xlsx.render(payloads);
    console.log('render Time:', stopwatch.microseconds);
    stopwatch.start();  
    await xlsx.save(path.join(__dirname, "/result.xlsx"));
    console.log('save Time:', stopwatch.microseconds);

    stopwatch.start();  
    xlsx.render(payloads2);
    console.log('render Time 2:', stopwatch.microseconds);
    stopwatch.start();  
    await xlsx.save(path.join(__dirname, "/result2.xlsx"));
    console.log('save Time 2:', stopwatch.microseconds);
}
f();


