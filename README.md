
# node-xlsx-template
A node module to generate .xlsx files from a .xlsx template.  

## How it works

xltpl uses exceljs to read and write .xlsx files，uses nunjucks as its template engine.  
When xltpl reads a .xlsx file, it creates a tree for each worksheet.  
Then, it translates the tree to a nunjucks template with custom tags.  
When the template is rendered, nunjucks extensions of cumtom tags call corresponding tree nodes to write the .xlsx file.  

## Syntax

xltpl uses nunjucks as its template engine, follows the [syntax of nunjucks template](https://mozilla.github.io/nunjucks/templating.html).  

Each worksheet is translated to a nunjucks template with custom tags.  

```nunjucks
...
...
{% row 45 %}
{% cell 46 %}{% endcell %}
{% cell 47 %}{% endcell %}
{% cell 48 %}{{address}}  {%xv v%}{% endcell %}
{% cell 49 %}{% endcell %}
{% cell 50 %}{% endcell %}
{% cell 51 %}{% endcell %}
{% cell 52 %}{% endcell %}
{% cell 53 %}{% endcell %}
{% row 54 %}
{% cell 55 %}{% endcell %}
{% cell 56 %}{% sec 0 %}{{name}}{% endsec %}{% sec 1 %}{{address}}{% endsec %}{% endcell %}
...
...
{% for item in items %}
{% row 64 %}
{% cell 65 %}{% endcell %}
{% cell 66 %}{% endcell %}
{% cell 67 %}{% endcell %}
{% cell 68 %}{% endcell %}
{% cell 69 %}{% endcell %}
{% cell 70 %}{% endcell %}
{% cell 71 %}{% endcell %}
{% cell 72 %}{% endcell %}
{% endfor %}
...
...

```

xltpl added 4 custom tags: row, cell, sec, and xv.  
row、cell、sec are used internally，used for row, cell and rich text.  
xv is used to define a variable.   
When a cell contains only a xv tag，this cell will be set to the type of the object returned from the variable evaluation.  
For example，if a cell contains only {%xv amt %}，and amt is a number，then this cell will be set to Number type，displaying with the style set on the cell.  
If there is another tag，it is equivalent to {{amt}}，will be converted to a string.  

## How to use

### Create a .xlsx template

You can add nunjucks template tags in worksheet cells and in cell notes(comments).   
For example, use 'beforerow{% for item in items %}' in a cell comment to specify control structure, use {{name}} or {%xv name%} in a cell to specify a variable.  
When adding a template tag in a cell comment, you need to use beforerow, beforecell, and aftercell to specify where the tag is inserted.   

### Prepare payload

In payload, you can use sheetTplName or sheetTplIndex to specify the worksheet to be used as the template, and use sheetName to specify the name of the worksheet to be generated.  


### Run the code

```javascript
let xXlsx = require('../xltpl/xXlsx');
async function f() {
    let xlsx = new xXlsx();
    await xlsx.load("./test.xlsx");    
    xlsx.render(payloads);
    await xlsx.save("./result.xlsx");    
}
f();
```