const {world, GameObject, Vector} = require("@tabletop-playground/api")

/**
 * Check if a given GameObject is valid and still exists.
 * @param {GameObject} obj - The GameObject to validate
 * @returns {Boolean} Returns true if obj is a GameObject and has not been destroyed.
 */
function isValidGameObject(obj) {
    return obj !== undefined && obj !== null && obj.isValid && obj.isValid()
}

function isPlayer(ply)
{
    return ply != null && ply.constructor.name == "Player"
}

function isGameObject(obj)
{
    return obj != null && ply.constructor.name == "GameObject"
}

function format(str, ...args) {
    return str.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != undefined
            ? args[number]
            : match
        ;
    });
}

module.exports.format = format;
module.exports.isValidGameObject = isValidGameObject;
module.exports.isPlayer = isPlayer;
module.exports.isGameObject = isGameObject;
