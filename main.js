/************
 * TODO: fix modules filter
 * TODO: Make sure that include[]=content_details is included
 * TODO: Look through https://d3plus.org/examples/d3plus-plot/bubble-plot/ and make array similar to what they want
 ***********/

const fs = require('fs');
const weeks = require('./vars.js');
const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncEach = promisify(asyncLib.each);

function retrieveInput() {
    return 16575;
}

async function retrieveModules(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules`);
}

async function retrieveModuleItems(courseId, moduleId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, { "include[]": "content_details" });
}

function matchModules(modules, moduleItem) {
    /* compare module_id of moduleItem to id of moduleList,
    return position of moduleList if line 30 is true*/
    let pos = 0;

    modules.forEach(module => {
        if (module.id === moduleItem.module_id) {
            pos = module.position;
        }
    });

    return (pos) ? pos : 0;
}

(async (courseId) => {
    let courseModules = [];
    let modules = await retrieveModules(courseId);

    /* iterate through all course modules asynchronously and retrieve each item */
    await asyncEach(modules, async module => {
        courseModules.push(await retrieveModuleItems(courseId, module.id));
    });

    let allItems = [];

    /* iterate through all module items and add ones with point value to the array gradedItems */
    courseModules.forEach(item => getAllItems(item));

    function getAllItems(items) {
        items.forEach(item => {
            allItems.push(item)
        });
    }

    let assignments = [];

    let typeToColor = {
        'Discussion': 'green',
        'Assignment': 'blue',
        'Quiz': 'red'
    }

    allItems.forEach(gradedItem => assignments.push({ id: gradedItem.title, x: matchModules(modules, gradedItem), y: gradedItem.position, value: gradedItem.content_details.points_possible || 0, type: typeToColor[gradedItem.type] || 'yellow' }));

    console.log(`GradedItems: ${allItems.length}, assignments: ${assignments.length}`);
    console.log(assignments);

    fs.writeFileSync('./data.json', JSON.stringify(assignments, null, 4));

    // new d3plus.Plot()
    //     .data(assignments)
    //     .groupBy("id")
    //     .size("value")
    //     .color("type")
    //     .sizeMin(20)
    //     .sizeMax(100)
    //     .render(0);



})(retrieveInput());