# course-visualization

## Description 
This tool allows the user to see a visualization of all course work (module items) found in a Canvas Course. This visualization is completed through a bubble chart. Each bubble is clickable and leads the user to the Module Item in Canvas.

## How to Install

To install the `course-visualization` program, simply execute:

```sh
# Clone the repository
$ git clone https://github.com/byuitechops/course-visualization.git

# Step into the folder that was just created as a result of the clone
$ cd ./course-visualization

# Install needed dependencies.
$ npm i
```

```sh
# Canvas requires a Canvas API token and we grab (will throw error if not there) it from the environment variables.

# Powershell
$ $env:CANVAS_API_TOKEN="${INSERT YOUR CANVAS API TOKEN HERE}"

# cmd
$ set CANVAS_API_TOKEN=${INSERT YOUR CANVAS API TOKEN HERE}

# Linux and Mac
$ export CANVAS_API_TOKEN="${INSERT YOUR CANVAS API TOKEN HERE}"
```

## How to Use
If you want to update the course data pulled from Canvas, execute:
```sh
npm start
```
This will write the data to a file in the `courseData` folder, and the name will be the course code and name of the course.

To generate the HTML file that contains the course visualization bubble chart, execute:
```sh
npm run make
```

This will go through every JSON file found in `courseData` folder and create a HTML file for a JSON file found. It will then create a HTML file that contains the bubble chart for that course. The file is generated as the following (assuming CS 124 as the course): `CS 124-Intro to Software Development (2-20-19)`.

You can then open the HTML file in any browser of your choosing (Internet Explorer users beware!).