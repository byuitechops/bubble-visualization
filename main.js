const fs = require('fs');
const canvas = require('canvas-api-wrapper');
const prompt = require('prompt');
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncReduce = promisify(asyncLib.reduce);
const json2csv = require('json2csv').parse;

var courseid;

/* Prompts the user for the course Id and calls the main function to run, passing that value */
function retrieveInput() {
    prompt.start();

    prompt.get('CourseID', (err, result) => {
        courseid = result.CourseID;
        runTool(result.CourseID);
    });
}

/* Makes an API call to Canvas to get a course */
async function retrieveCourse(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}`);
}

/* Makes an API call to Canvas to get all modules in the course */
async function retrieveModules(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules`);
}

/* Makes an API call to Canvas to get all module items in the course */
async function retrieveModuleItems(courseId, moduleId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
        "include[]": "content_details"
    });
}

/* Main function that runs the whole show */
async function runTool(courseId) {
    let courseModules = [];
    let excludeModule = ['Welcome', 'Instructor Resources', 'Resources', 'Instructor Resources (Do NOT Publish)']
    let modules = await retrieveModules(courseId);

    /* Filters the modules to excluse the ones named in the excludeModule array */
    modules = modules.filter(moduleIn => !excludeModule.includes(moduleIn.name));

    /* Maps the module item type to a number that is later interpreted into a color */
    let typeToColor = {
        'Discussion': 1,
        'Assignment': 2,
        'Quiz': 3
    }

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
                moduleItem.position = (i + 1) * -1;
                moduleItem.moduleName = moduleIn.name;
                moduleItem.modulePosition = moduleIn.position;
                return moduleItem;
            })

            .filter(moduleItem => moduleItem.type !== "SubHeader")

        return acc.concat(moduleItems);
    });



    /* Creates the module item object with necessary properties */
    allItems = allItems.map(gradedItem => {
        return {
            Name: gradedItem.title,
            ModulePosition: gradedItem.modulePosition,
            'Module Name': gradedItem.moduleName,
            Position: gradedItem.position,
            Points: gradedItem.content_details.points_possible || 0,
            Type: gradedItem.type,
            URL: gradedItem.type == 'ExternalUrl' ? `https://byui.instructure.com/courses/${courseid}/modules#module_${gradedItem.module_id}` : gradedItem.html_url
        }
    });

    /* Calls to get course from Canvas (so we can retrieve the course name) */
    let theCourse = await retrieveCourse(courseid);
    var courseTitle = `${theCourse.course_code}-${theCourse.name}`;

    /* Converts JSON to CSV */
    var fields = ['Name', 'ModulePosition', 'Module Name', 'Position', 'Points', 'Type', 'URL'];
    var csv = json2csv(allItems, fields);
    /* Writes all data to a CSV file with the course name as the filename */
    fs.writeFileSync(`./courseData/${courseTitle}.csv`, csv, 'utf8');

    /* Writes all the module item objects to a file with the course name as the filename */
    fs.writeFileSync(`./courseData/${courseTitle}.json`, JSON.stringify(allItems, null, 4));
}

retrieveInput();