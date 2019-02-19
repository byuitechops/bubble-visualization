var fs = require('fs'),
    Handlebars = require('Handlebars'),
    moment = require('moment');

/* Filename to read in json data from (also appears as the course name in the bubble chart) */
// TODO change this filename to the name of the json file (without the file ending)
var fileName = 'AUTO 125-Intro to Automotive Tech';

/* Reads in JSON data and parses it */
var data = fs.readFileSync(`./courseData/${fileName}.json`, 'utf8');
data = JSON.parse(data);

/* Handlebars stuff */
var templateFile = fs.readFileSync('template.handlebars', 'utf8');
var template = Handlebars.compile(templateFile);

var context = {
    data: JSON.stringify(data, null, 4),
    courseName: fileName
};

/* Getting current date to add to filename */
let time = moment().format('MM-DD-YY');

/* Write template to a file with course code, name, and current date as the title */
fs.writeFileSync(`./htmlFiles/${fileName} (${time}).html`, template(context), 'utf8');