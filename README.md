
# xltpl ( node-xlsx-template )
A node module to generate .xlsx files from a .xlsx template.

## How it works

When xltpl reads a xlsx file, it creates a tree for each worksheet.  
And, each tree is translated to a nunjucks(jinja2) template with custom tags.  
When the template is rendered, nunjucks extensions of cumtom tags call corresponding tree nodes to write the xlsx file.

## How to install

```shell
npm install xltpl
```

## How to use

*   To use xltpl, you need to be familiar with the [syntax of nunjucks template](https://mozilla.github.io/nunjucks/templating.html).
*   Get a pre-written xls/x file as the template.
*   Insert variables in the cells, such as : 

```jinja2
{{name}}
```

*   Insert control statements in the cells :

```jinja2
{%- for row in rows %}
{% set outer_loop = loop %}{% for row in rows %}
Cell text
{{outer_loop.index}}{{loop.index}}
{%+ endfor%}{%+ endfor%}
```

*   Run the code
```javascript
let BookWriter = require('xltpl');
function run() {
    let writer = new BookWriter();
    let p = writer.readFile('template.xlsx');
    p.then(async function () {
        let payloads = await getPayloads();
        writer.renderSheets(payloads);
        await writer.save('result.xlsx');
    })
}
run();
```
See [examples](https://github.com/zhangyu836/node-xlsx-template/tree/master/examples). 

## Supported
* MergedCell   
* Non-string value for a cell (use **{{variable}}** with no leading  or trailing spaces or **{%xv variable%}** to specify a variable) 
* Image (use **{%img variable%}**)  
* DataValidation   
* AutoFilter


## Related

* [xltpl for python](https://github.com/zhangyu836/xltpl)
* [exceljs](https://github.com/exceljs/exceljs)
* [nunjucks](https://mozilla.github.io/nunjucks/)

