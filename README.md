# bubble-visualization

## Description 
This tool allows users to visualize all course work (module items) in a canvas course on a bubble chart. Each bubble is clickable and links to the module item in canvas.

## How to Install

Standard Install

1. Clone this repository:
    ```bash
    git clone https://github.com/byuitechops/bubble-visualization.git
    ```
1. Step into the folder that was just created 
    ```bash
    cd ./bubble-visualization
    ```
1. To install dependancies, run:
    ```bash
    npm i
    ```

## How to Use
1. If you want to update the data pulled from canvas, run:
```bash
npm start
```
This will write the data to a file in the courseData folder, and the name will be the course code and name of the course.

2. To generate the HTML file that contains the course visualization bubble chart, first go into the makeFile.js file and update the filename with whatever JSON data file you are trying to display. Then, run:
```bash
node makeFile.js
```
This file will be within the htmlFiles folder, and named with the course code and name as well as the date it was generated.

The newly generated HTML file can now be viewed using a live server, or as any other HTML file may be used.

Enjoy the bubbles!