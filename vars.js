//creates an array of size 14 and like ['Week 01', 'Week 02', ... , 'Week 14']
module.exports = Array.from(Array(14), (_, i) => `Week ${i+1 < 10 ? `0${i+1}` : i+1}`);