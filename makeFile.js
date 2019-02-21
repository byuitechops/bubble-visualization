const fs = require('fs');
const path = require('path');
const moment = require('moment');
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncEach = promisify(asyncLib.each);
const Handlebars = require('Handlebars');

(async () => {
    // Grabbing only JSON files
    let files = fs.readdirSync('./courseData')
        .filter(file => path.extname(file) !== '.csv')

    await asyncEach(files, fileName => {
        let courseName = fileName.split('-')[0];

        // Reads in JSON data and parses it
        let data = JSON.parse(fs.readFileSync(`./courseData/${fileName}`, 'utf8'));

        // Handlebars stuff
        let templateFile = fs.readFileSync('newTemplate.handlebars', 'utf8');
        let template = Handlebars.compile(templateFile);

        let context = {
            data: JSON.stringify(data, null, 4),
            courseName: courseName
        };

        // Getting current date to add to filename
        let time = moment().format('MM-DD-YY');

        // Write template to a file with course code, name, and current date as the title
        fs.writeFileSync(`./htmlFiles/${fileName.split('.')[0]} (${time}).html`, template(context), 'utf8');
    });
})();