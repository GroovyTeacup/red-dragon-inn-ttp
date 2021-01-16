const {Vector} = require("@tabletop-playground/api");
const {makeTurnCounter} = require("@wodysus-ttp/turncounter");

makeTurnCounter(refObject, new Vector(0, 0, 30), "color", 1, 2);