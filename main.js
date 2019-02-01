/************
 * TODO: fix modules filter
 * TODO: Make sure that include[]=content_details is included
 * TODO: Look through https://d3plus.org/examples/d3plus-plot/bubble-plot/ and make array similar to what they want
 ***********/


const weeks = require('./vars.js');
const canvas = require('canvas-api-wrapper');
// const d3plus = require('d3plus');
const asyncLib = require('async');
const {
    promisify
} = require('util');
const asyncEach = promisify(asyncLib.each);

function retrieveInput() {
    return 18664;
}

async function retrieveModules(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules`);
}

async function retrieveModuleItems(courseId, moduleId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, { "include[]": "content_details" });
}

(async (courseId) => {
    let courseModules = [];
    let modules = await retrieveModules(courseId);

    modules = modules.filter(module => weeks.includes(module.name));


    //iterate through all course modules asynchronously and retrieve each item
    await asyncEach(modules, async module => {
        courseModules.push(await retrieveModuleItems(courseId, module.id));
    });

    let gradedItems = [];

    //iterate through all module items and add ones with point value to the array gradedItems
    courseModules.forEach(item => containsCourseDetails(item));

    function containsCourseDetails(items) {
        // console.log(items);
        items.forEach(item => {
            if (item.content_details.points_possible) {
                gradedItems.push(item)
            }
        });
    }

    let assignments = [];

    gradedItems.forEach(gradedItem => assignments.push({ id: gradedItem.title, x: gradedItem.title.substring(1, 3), y: 1, value: gradedItem.content_details.points_possible }));

    console.log(assignments);

    // new d3plus.Plot()
    //     .data(assignments)
    //     .groupBy("id")
    //     .size("value")
    //     .sizeMin(20)
    //     .sizeMax(100)
    //     .render(0);



})(retrieveInput());