let path = require('path');
let {getPersons} = require('./getdata');
let BookWriter = require('xltpl');

function run() {
    let tplFilename = path.join(__dirname, "example.xlsx");
    let resultFilename0 = path.join(__dirname, "result0.xlsx");
    let resultFilename1 = path.join(__dirname, "result1.xlsx");
    let writer = new BookWriter();
    let p = writer.readFile(tplFilename);
    p.then(async function () {
        let [person0, person1, person2] = await getPersons();
        person0['sheet_name'] = 'cn';
        person1['sheet_name'] = 'en';
        //#person0['tpl_index'] = 0 default 0
        person1['tpl_index'] = 1;
        let payloads = [person0, person1];
        writer.renderSheets(payloads);
        person0['sheet_name'] = 'en';
        person1['sheet_name'] = 'cn';
        writer.renderSheets(payloads);//append
        person2['tpl_name'] = 'en';
        person2['sheet_name'] = 'hello sheet';
        writer.renderSheet(person2);
        person2['tpl_name'] = 'list0';
        person2['sheet_name'] = 'list0';
        for(let i=0; i<1111; i++){
            writer.renderSheet(person2);
        }
        person2['tpl_name'] = 'list1';
        person2['sheet_name'] = 'list1';
        for(let i=0; i<1111; i++){
            writer.renderSheet(person2);
        }
        let persons = {'ps': [person1, person2, person0, person0],
            'tpl_name': 'image', 'sheet_name': 'image'};
        writer.renderSheet(persons);
        person0['sheet_name'] = '';// no sheet name
        person1['sheet_name'] = '';
        writer.renderSheets(payloads);
        await writer.save(resultFilename0);
        payloads = [person0, person1, person2, persons];
        writer.renderSheets(payloads);
        for(let p of payloads){
            p['sheet_name'] = 'all_in_one';
        }
        writer.renderSheets(payloads);
        await writer.save(resultFilename1);
    })
}

run();


