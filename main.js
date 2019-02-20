const fs = require('fs');
const canvas = require('canvas-api-wrapper');
const prompt = require('prompt');
const json2csv = require('json2csv').parse;
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncReduce = promisify(asyncLib.reduce);

// var courseid;

/* Prompts the user for the course Id and calls the main function to run, passing that value */
function retrieveInput() {
    prompt.start();

    prompt.get('CourseID', (err, result) => {
        if (err) {
            console.log('\n\nERROR: ', err.message);
            return;
        } else if (!parseInt(result.CourseID, 10)) {
            console.log('\nERROR: Invalid input.');
            return;
        }

        checkFolders();
        runTool(result.CourseID);
    });
}

/* Makes an API call to Canvas to get a course */
async function retrieveCourse(courseId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}`);
    } catch (err) {
        throw err;
    }
}

/* Makes an API call to Canvas to get all modules in the course */
async function retrieveModules(courseId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}/modules`);
    } catch (err) {
        throw err;
    }
}

/* Makes an API call to Canvas to get all module items in the course */
async function retrieveModuleItems(courseId, moduleId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
            "include[]": "content_details"
        });
    } catch (err) {
        throw err;
    }
}

/* Simplify a portion inside runTool() */
function returnModuleUrl(courseId, moduleId) {
    return `https://byui.instructure.com/courses/${courseId}/modules#module_${moduleId}`;
}

function checkFolders() {
    const courseDataPath = './courseData';
    const htmlFilesPath = './htmlFiles';

    if (!fs.existsSync(courseDataPath))
        fs.mkdirSync(courseDataPath);

    if (!fs.existsSync(htmlFilesPath))
        fs.mkdirSync(htmlFilesPath);
}

/* Main function that runs the whole show */
async function runTool(courseId) {
    let excludeModules = ['Welcome', 'Instructor Resources', 'Resources', 'Instructor Resources (Do NOT Publish)']
    let modules;

    /* Maps the module item type to a number that is later interpreted into a color */
    /* TO DO */
    let typeToColor = {
        'Discussion': 1,
        'Assignment': 2,
        'Quiz': 3
    }

    //we are not sure if the courseId is valid so we wrap the function call in a try/catch statement
    try {
        modules = await retrieveModules(courseId);
    } catch (err) {
        console.log('ERROR: ', err.message);
        return;
    }

    /* Filters the modules to exclude the ones named in the excludeModules array */
    modules = modules.filter(moduleIn => !excludeModules.includes(moduleIn.name));

    console.log('Retrieved all modules...');

    /* Retrieves all module items for each module */
    let allItems = await asyncReduce(modules, [], async (acc, moduleIn) => {
        let moduleItems = await retrieveModuleItems(courseId, moduleIn.id);
        moduleItems = moduleItems
            /* drop the no points/ 0 points */
            // .filter(item => item.content_details !== undefined && item.content_details.points_possible > 0)
            /* make sure they are in order */
            .sort((a, b) => a.position - b.position)
            /* Adds the Module name and position to each module item object */
            .map((moduleItem, i) => {
                moduleItem.position = -(i + 1);
                moduleItem.moduleName = moduleIn.name;
                moduleItem.modulePosition = moduleIn.position;
                return moduleItem;
            })
            .filter(moduleItem => moduleItem.type !== "SubHeader");

        return acc.concat(moduleItems);
    });

    console.log('Retrieved all module items...');

    /* Creates the module item object with necessary properties */
    allItems = allItems.map(gradedItem => {
        return {
            Name: gradedItem.title,
            ModulePosition: gradedItem.modulePosition,
            'Module Name': gradedItem.moduleName,
            Position: gradedItem.position,
            Points: gradedItem.content_details.points_possible || 0,
            Type: gradedItem.type,
            URL: gradedItem.type === 'ExternalUrl' ? returnModuleUrl(courseId, gradedItem.module_id) : gradedItem.html_url
        };
    });

    console.log('About to create necessary files...');

    /* Calls to get course from Canvas (so we can retrieve the course name) */
    let theCourse = await retrieveCourse(courseId);
    let courseTitle = `${theCourse.course_code}-${theCourse.name}`;

    /* Converts JSON to CSV */
    let fields = ['Name', 'ModulePosition', 'Module Name', 'Position', 'Points', 'Type', 'URL'];
    let csv = json2csv(allItems, fields);

    /* Writes all data to a CSV file with the course name as the filename */
    fs.writeFileSync(`./courseData/${courseTitle}.csv`, csv, 'utf8');

    /* Writes all the module item objects to a file with the course name as the filename */
    fs.writeFileSync(`./courseData/${courseTitle}.json`, JSON.stringify(allItems, null, 4));
    console.log('Files creation completed.');
}

retrieveInput();