const characters = require("./characters.json")
const {world, GameObject} = require("@tabletop-playground/api")

module.exports = {
    /**
     * Find a character by name and return the JSON object for its container
     *
     * @param {String} text - Name of the character. Ex; "Zot the Wizard"
     * @returns {Object} JSON Object
     */
    getCharacter: function(text)
    {
        for (let tbl in characters)
        {
            if (tbl.name.contains(text))
            {
                return characters[tbl.name]
            }
        }
    },

    addCharacter: function(obj) 
    {
        if (!obj || !obj.isValid() || obj.constructor.name != "Container") throw "Invalid object. Must exist and be a container."

        let tbl = {}
        tbl.name = obj.getName()
        tbl.numItems = obj.getNumItems()
        tbl.json = obj.toJSONString()

        console.log(JSON.stringify(tbl))
        console.log("Copy this JSON and make a new entry for it in characters.json. Remove existing entry if updating.")

        characters[tbl.name] = tbl

        return tbl
    },

    spawnCharacterContainer: function(text, pos)
    {
        let character = this.getCharacter()

        return world.createObjectFromJSON(character.json, pos)
    },

    /**
     * Find all character containers on the table and add events to give them functionality.
     *
     * @param {Vector[]} containerPositions - An array containing the positions character containers will be dropped at for each player color. This is ordered by Player.getSlot
     */
    propagateCharacterContainerEvents: function(containerPositions)
    {
        let objs = world.getAllObjects()
        let names = Object.keys(characters) // Get an Array of keys in our characters.json file. In this case, it's the character names.

        // Loop through all objects in the world.
        objs.forEach((obj, idx, arr) => {
            if (names.indexOf(obj.getName()) != -1) // If the object name matches any of the character names, continue.
            {
                // Make sure this object is a container and isn't one that's been spawned by the player.
                if (!obj.isValid() || obj.getContainer() != null || obj.constructor.name != "Container" || obj.spawnedContainer || obj.getDescription() == "!!!") return

                obj.character = characters[obj.getName()]
                obj.spawnPos = obj.getPosition()
                obj.spawnRot = obj.getRotation()

                // Make container penetrable
                obj.setObjectType(2)

                // Make sure players can't muck up the containers
                obj.onTick.add(function(obj, dt) {
                     // If the container ends up in another container, take it out.
                    if (obj.getContainer() != null) 
                    {
                        let container = obj.getContainer()
                        container.takeAt(container.getItems().indexOf(obj), obj.spawnPos)
                    }
                })

                obj.onPrimaryAction.add(function(obj, ply) {
                    let pos = containerPositions[ply.getSlot()] || new Vector(40.5, -27.75, 100);
                    let newObj = world.createObjectFromJSON(obj.character.json, pos[0])

                    newObj.setRotation(pos[1])
                    newObj.spawnedContainer = true
                    newObj.setDescription("!!!")
                })

                // When a player grabs one of the containers, let them know to press R to use it.
                obj.onGrab.add(function(obj, ply) {
                    ply.sendChatMessage("Press R on the container to spawn it in front of your player mat area.", new Color(1, 0, 0, 1))
                    ply.showMessage("Press R on the container to spawn it in front of your player mat area.")
                })

                // Move the container back to where to was after it's released
                obj.onReleased.add(function(obj, ply, thrown, grabPos, grabRot) {
                    obj.setPosition(obj.spawnPos)
                    obj.setRotation(obj.spawnRot)
                    obj.setLinearVelocity(new Vector(0, 0, 0))
                })

                //console.log("Propagated events for ", obj.getName())
            }
        })

        console.log("Propagated character container events.")
    }
}