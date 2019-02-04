/************
 * TODO: fix modules filter
 * TODO: Make sure that include[]=content_details is included
 * TODO: Look through https://d3plus.org/examples/d3plus-plot/bubble-plot/ and make array similar to what they want
 ***********/

const fs = require('fs');
const weeks = require('./vars.js');
const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const { promisify } = require('util');
const asyncReduce = promisify(asyncLib.reduce);

function retrieveInput() {
    return 16575;
}

async function retrieveModules(courseId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules`);
}

async function retrieveModuleItems(courseId, moduleId) {
    return await canvas.get(`/api/v1/courses/${courseId}/modules/${moduleId}/items`, { "include[]": "content_details" });
}


(async (courseId) => {
    let courseModules = [];
    let excludeModule = ['Welcome', 'Instructor Resources', 'Resources']
    let modules = await retrieveModules(courseId);

    modules = modules.filter(moduleIn => !excludeModule.includes(moduleIn.name));

    // console.log(modules);

    // let typeToColor = {
    //     'Discussion': 'green',
    //     'Assignment': 'blue',
    //     'Quiz': 'red'
    // }
    let typeToColor = {
        'Discussion': 1,
        'Assignment': 2,
        'Quiz': 3
    }


    /* iterate through all course modules asynchronously and retrieve each item */
    let allItems = await asyncReduce(modules, [], async (acc, moduleIn) => {
        let moduleItems = await retrieveModuleItems(courseId, moduleIn.id);
        moduleItems = moduleItems
            // drop the no points/ 0 points
            // .filter(item => item.content_details !== undefined && item.content_details.points_possible > 0)
            //make sure they are in order
            .sort((a, b) => a.position - b.position)
            .map((moduleItem, i) => {
                moduleItem.position = (i + 1) * -1;
                moduleItem.moduleName = moduleIn.name;
                moduleItem.modulePosition = moduleIn.position;
                return moduleItem;
            })
        return acc.concat(moduleItems);
    });


    allItems = allItems.map(gradedItem => {
        return {
            Name: gradedItem.title,
            ModulePosition: gradedItem.modulePosition,
            'Module Name': gradedItem.moduleName,
            Position: gradedItem.position,
            Points: gradedItem.content_details.points_possible || 0,
            Type: gradedItem.type
            // Color: typeToColor[gradedItem.type] || 'yellow'
        }

    });


    fs.writeFileSync('./data.json', JSON.stringify(allItems, null, 4));

})(retrieveInput());