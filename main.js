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
    return 21050;
}

async function retrieveModules(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules`);
}

async function retrieveModuleItems(courseId, moduleId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`);
}

(async (courseId) => {
    let courseModules = [];
    let modules = await retrieveModules(courseId);

    console.log(modules);
    //this next part doesn't quite work yet since the canvas course (my sandbox) is somehow messed up. I ran out of time while trying to figure it out.
    modules = modules.filter(async module => {
        if (await asyncEach(weeks, week => week.includes(module.name))) return true;

        return false;
    });

    //iterate through all course modules asynchronously and retrieve each item
    await asyncEach(modules, async module => {
        courseModules.push(await retrieveModuleItems(courseId, module.id));
    });

})(retrieveInput());