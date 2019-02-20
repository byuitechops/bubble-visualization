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
    /* Filename to read in json data from (also appears as the course name in the bubble chart) */
    // TODO change this filename to the name of the json file (without the file ending)
    let files = fs.readdirSync('./courseData')
        .filter(file => path.extname(file) !== '.csv')

    await asyncEach(files, fileName => {
        /* Reads in JSON data and parses it */
        let data = JSON.parse(fs.readFileSync(`./courseData/${fileName}`, 'utf8'));

        /* Handlebars stuff */
        let templateFile = fs.readFileSync('template.handlebars', 'utf8');
        let template = Handlebars.compile(templateFile);

        let context = {
            data: JSON.stringify(data, null, 4),
            courseName: fileName
        };

        /* Getting current date to add to filename */
        let time = moment().format('MM-DD-YY');

        /* Write template to a file with course code, name, and current date as the title */
        fs.writeFileSync(`./htmlFiles/${fileName} (${time}).html`, template(context), 'utf8');
    });
})();