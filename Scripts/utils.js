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

function isServerHost(ply)
{
    return isPlayer(ply) && ply === world.getAllPlayers()[0]
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

// this can act really odd due to gravity
/**
 * "Smootly" moves an object in a straight line to the given position.
 *
 * @param {GameObject} obj - The object to mpve
 * @param {Vector} pos - Where the object is moving to
 * @param {function} callback - The function to call when the object has finished moving
 * @param {number} [speed=10] - Interpolation speed
 */
function setPositionSmooth(obj, pos, callback, speed=10)
{
    if (!isValidGameObject(obj)) throw "Invalid GameObject"

    let oldType = obj.getObjectType()
    let moving = true

    function smoothOnTick(self, dt)
    {
        let newPos = Vector.interpolateTo(self.getPosition(), pos, dt, speed)
        obj.setPosition(newPos)

        if (self.getPosition().distance(pos) < 1) 
        {
            moving = false
            self.onTick.remove(smoothOnTick)
            obj.setObjectType(oldType)

            if (callback) callback(obj)
        }
    }

    obj.setObjectType(2) // set penetrable
    obj.onTick.add(smoothOnTick)

    setTimeout(() => {
        // If it's still moving after 5 seconds, stop.
        if (moving && obj) 
        {
            obj.onTick.remove(smoothOnTick)
            obj.setObjectType(oldType)
            if (callback) callback(obj)
        }
    }, 5000);
}

module.exports.format = format;
module.exports.isValidGameObject = isValidGameObject;
module.exports.isPlayer = isPlayer;
module.exports.isGameObject = isGameObject;
module.exports.isServerHost = isServerHost;
module.exports.setPositionSmooth = setPositionSmooth;