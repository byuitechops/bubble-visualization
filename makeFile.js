var fs = require('fs'),
    Handlebars = require('Handlebars');

var data = [{
        "Name": "Standard Resources",
        "ModulePosition": 1,
        "Module Name": "Instructor Resources (Do NOT Publish)",
        "Position": -1,
        "Points": 0,
        "Type": "SubHeader"
    },
    {
        "Name": "End of Course Evaluation",
        "ModulePosition": 1,
        "Module Name": "Instructor Resources (Do NOT Publish)",
        "Position": -2,
        "Points": 0,
        "Type": "ExternalUrl"
    }
];

var templateFile = fs.readFileSync('template.handlebars', 'utf8');
var template = Handlebars.compile(templateFile);

var context = {
    data: JSON.stringify(data, null, 4)
};

fs.writeFileSync("Html.html", template(context), 'utf8');