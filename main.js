const fs = require('fs');
const canvas = require('canvas-api-wrapper');
const prompt = require('prompt');
const json2csv = require('json2csv').parse;
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncReduce = promisify(asyncLib.reduce);

/***************************************************
 * retrieveInput
 * 
 * This function prompts the user for the course ID
 * for course visualization. This also handles errors.
 **************************************************/
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

/*************************************************
 * retrieveCourse
 * @param {Int} courseId
 * @returns {Array} the course itself
 * 
 * This function makes an API call to Canvas and
 * returns whatever it retrieves from the API call
 * to the caller.
 *************************************************/
async function retrieveCourse(courseId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}`);
    } catch (err) {
        throw err;
    }
}

/*************************************************
 * retrieveModules
 * @param {Int} courseId
 * @returns {Array} all of the course modules
 * 
 * This function makes an API call to Canvas to 
 * retrieve all of the course modules with the 
 * provided course ID.
 *************************************************/
async function retrieveModules(courseId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}/modules`);
    } catch (err) {
        throw err;
    }
}

/*************************************************
 * retrieveModuleItems
 * @param {Int} courseId
 * @param {Int} moduleId
 * @returns {Array} module items
 * 
 * This function makes an API call to Canvas to 
 * retrieve all of the module items found in the
 * provided module ID in the provided course.
 *************************************************/
async function retrieveModuleItems(courseId, moduleId) {
    try {
        return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, {
            "include[]": "content_details"
        });
    } catch (err) {
        throw err;
    }
}

/*************************************************
 * retrieveModuleItems
 * @param {Int} courseId
 * @param {Int} moduleId
 * @returns {String} Canvas link
 * 
 * This function returns a string for a specific
 * module item.
 *************************************************/
function returnModuleUrl(courseId, moduleId) {
    return `https://byui.instructure.com/courses/${courseId}/modules#module_${moduleId}`;
}

/*************************************************
 * checkFolders
 * 
 * This function checks for the two folders. If 
 * they do not exist, this function will also 
 * create an empty folder.
 *************************************************/
function checkFolders() {
    const courseDataPath = './courseData';
    const htmlFilesPath = './htmlFiles';

    if (!fs.existsSync(courseDataPath))
        fs.mkdirSync(courseDataPath);

    if (!fs.existsSync(htmlFilesPath))
        fs.mkdirSync(htmlFilesPath);
}

/*************************************************
 * buildModuleItems
 * @param {Int} courseId
 * @param {Array} modules
 * @returns {Array} module items for the modules
 * 
 * This function returns an array of all module items
 * for each module.
 *************************************************/
async function buildModuleItems(courseId, modules) {
    /* Retrieves all module items for each module */
    return await asyncReduce(modules, [], async (acc, moduleIn) => {
        let moduleItems = await retrieveModuleItems(courseId, moduleIn.id);
        moduleItems = moduleItems
            // drop the no points/ 0 points
            // .filter(item => item.content_details !== undefined && item.content_details.points_possible > 0)
            // make sure they are in order
            .sort((a, b) => a.position - b.position)
            // Adds the Module name and position to each module item object
            .map((moduleItem, i) => {
                moduleItem.position = -(i + 1);
                moduleItem.moduleName = moduleIn.name;
                moduleItem.modulePosition = moduleIn.position;
                return moduleItem;
            })
            .filter(moduleItem => moduleItem.type !== "SubHeader");

        return acc.concat(moduleItems);
    });
}

/*************************************************
 * createModuleItemObject
 * @param {Int} courseId
 * @param {Array} allItems
 * @returns {Array} A JSON object for bubble chart 
 * 
 * This function returns an array of JSON objects
 * for the bubble chart.
 *************************************************/
function createModuleItemObject(courseId, allItems) {
    return allItems.map(gradedItem => {
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

}

/*************************************************
 * saveData
 * @param {Int} courseId
 * @param {Array} allItems
 * 
 * This function simply saves the data to the correct
 * folder.
 * 
 *************************************************/
async function saveData(courseId, allItems) {
    // Calls to get course from Canvas (so we can retrieve the course name)
    let theCourse = await retrieveCourse(courseId);
    let courseTitle = `${theCourse.course_code}-${theCourse.name}`;

    // Converts JSON to CSV
    let fields = ['Name', 'ModulePosition', 'Module Name', 'Position', 'Points', 'Type', 'URL'];
    let csv = json2csv(allItems, fields);

    // Writes all data to a CSV file with the course name as the filename
    fs.writeFileSync(`./courseData/${courseTitle}.csv`, csv, 'utf8');

    // Writes all the module item objects to a file with the course name as the filename
    fs.writeFileSync(`./courseData/${courseTitle}.json`, JSON.stringify(allItems, null, 4));
}

/*************************************************
 * runTool
 * @param {Int} courseId
 * 
 * This function serves as the driver for the 
 * program. It calls all of the correct functions.
 *************************************************/
async function runTool(courseId) {
    let excludeModules = ['Welcome', 'Instructor Resources', 'Resources', 'Instructor Resources (Do NOT Publish)']
    let modules;

    // TO DO
    // Maps the module item type to a number that is later interpreted into a color
    let typeToColor = {
        'Discussion': 1,
        'Assignment': 2,
        'Quiz': 3
    }

    // We are not sure if the courseId is valid so we wrap the function call in a try/catch statement
    try {
        modules = await retrieveModules(courseId);
    } catch (err) {
        console.log('ERROR: ', err.message);
        return;
    }

    // Filters the modules to exclude the ones named in the excludeModules array
    modules = modules.filter(moduleIn => !excludeModules.includes(moduleIn.name));

    console.log('Retrieved all modules...');

    let allItems = await buildModuleItems(courseId, modules);

    console.log('Retrieved all module items...');

    // Creates the module item object with necessary properties
    allItems = createModuleItemObject(courseId, allItems);

    console.log('About to create necessary files...');

    await saveData(courseId, allItems);

    console.log('Files creation completed.');
}

retrieveInput();