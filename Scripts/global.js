const {world, globalEvents, GameObject, Vector, Rotator} = require("@tabletop-playground/api")
const characters = require("./characters")
const drinks = require("./drinks")

// Color slot order: 
// Blue, Green, Red, Teal, Purple, Pink, Orange, Brown, White, Yellow

const containerPositions = []
containerPositions.push([new Vector(40.5, -27.75, 100), new Rotator(0, 0, 0)]) // Blue (Slot 0)
containerPositions.push([new Vector(-40.5, -27.75, 100), new Rotator(0, 0, 0)]) // Green (Slot 1)
containerPositions.push([new Vector(-40.5, 27.75, 100), new Rotator(0, 180, 0)]) // Red (Slot 2)
containerPositions.push([new Vector(0, -27.75, 100), new Rotator(0, 0, 0)]) // Teal (Slot 3)
containerPositions.push([new Vector(65, -18, 100), new Rotator(0, 90, 0)]) // Purple (Slot 4)
containerPositions.push([new Vector(65, 18, 100), new Rotator(0, 90, 0)]) // Pink (Slot 5)
containerPositions.push([new Vector(-65, 18, 100), new Rotator(0, -90, 0)]) // Orange (Slot 6)
containerPositions.push([new Vector(0, 27.75, 100), new Rotator(0, 180, 0)]) // Brown (Slot 7)
containerPositions.push([new Vector(40.5, 27.75, 100), new Rotator(0, 180, 0)]) // White (Slot 8)
containerPositions.push([new Vector(-65, -18, 100), new Rotator(0, -90, 0)]) // Yellow (Slot 9)

characters.propagateCharacterContainerEvents(containerPositions)
drinks.propagateDrinkDeckContainerEvents(new Vector(-20.25, -8.65, 100))

const rulebooks = {
    ["6AAA29CA44AD09F20548E09BE4F59147"]: "1A41624C4DA6AF28DEA3AC92E899F16D", // RDI 1 Rules
    ["DA5BDFAE4DB2EAF5212094A1737087F0"]: "95EC7C404DD5655FF408D58E604C0E3A", // RDI 2 Rules
    ["4D8D94604B63A6DEF787EB824B22E129"]: "FC2EDC204235383D141A52A7E389A1B3", // RDI 3 Rules
    ["F7ACA93249629C0330F24490C8FE3D79"]: "E8517CFD4F54D998BE16E79CC846DFA4", // RDi 4 Rules
    ["897AC36B4347DA43B6A7B5BA0E336081"]: "67D3811443E203F64AE4F2999BA8206F", // RDI 5 Rules
    ["E45DB7C947E96B4687DEC790D4A4B10F"]: "792138894C676C7E3DB53EAF0A595CEB", // RDI 6 Rules
    ["44513DD8429E43F1211E5B9BF76E641E"]: "D71AD4A94E934139427F289E8628F149", // RDI 7 Rules
    ["RDIEventExtraRules"]: "A0EC021243A63B10CD9F248B205D9AAB",
}

//const rulebookCovers = ["6AAA29CA44AD09F20548E09BE4F59147", "DA5BDFAE4DB2EAF5212094A1737087F0", "4D8D94604B63A6DEF787EB824B22E129", "F7ACA93249629C0330F24490C8FE3D79", "897AC36B4347DA43B6A7B5BA0E336081", "E45DB7C947E96B4687DEC790D4A4B10F", "44513DD8429E43F1211E5B9BF76E641E"]
//const rulebooks2 = ["1A41624C4DA6AF28DEA3AC92E899F16D", "95EC7C404DD5655FF408D58E604C0E3A", "FC2EDC204235383D141A52A7E389A1B3", "E8517CFD4F54D998BE16E79CC846DFA4", "67D3811443E203F64AE4F2999BA8206F", "792138894C676C7E3DB53EAF0A595CEB", "D71AD4A94E934139427F289E8628F149"]

//world.startDebugMode()

/*globalEvents.onScriptButtonPressed.add((_, idx) => {
    if (idx == 10 && _.getHighlightedObject())
    {
        console.log(_.getHighlightedObject().getTemplateId())
    }
})*/


// This doesn't really need its own file

world.getAllObjects().forEach((obj, idx) => {
    if (rulebooks[obj.getTemplateId()] != null && obj.constructor.name == "MultistateObject" && !obj.getContainer())
    {
        obj.onPrimaryAction.add((obj, ply) => {
            if (rulebooks[obj.getTemplateId()] != null)
            {
                let id = rulebooks[obj.getTemplateId()]

                let pos = obj.getPosition()
                let rot = obj.getRotation()
                let scale = obj.getScale()
                let name = obj.getName()

                obj.destroy()

                let rulebook = world.createObjectFromTemplate(id, pos)
                rulebook.setRotation(rot)
                rulebook.setScale(scale)
                rulebook.setName(name)
            }
        })

        obj.onNumberAction.add((obj, ply, num) => {
            if (rulebooks[obj.getTemplateId()] != null)
            {
                let id = rulebooks[obj.getTemplateId()]

                let pos = obj.getPosition()
                let rot = obj.getRotation()
                let scale = obj.getScale()
                let name = obj.getName()

                obj.destroy()

                let rulebook = world.createObjectFromTemplate(id, pos)
                rulebook.setRotation(rot)
                rulebook.setScale(scale)
                rulebook.setName(name)
                rulebook.setState(num)
            }
        })
    }
})

/*world.getAllObjects().forEach((obj, idx) => {
    if (rulebooks2.indexOf(obj.getTemplateId()) != -1 && obj.constructor.name == "MultistateObject" && !obj.getContainer())
    {
        console.log("ok replacing")
        console.log("rulebooks2 idx", rulebooks2.indexOf(obj.getTemplateId()))
        console.log("rulebooks2 idx val", rulebookCovers[rulebooks2.indexOf(obj.getTemplateId())])
        let id = rulebookCovers[rulebooks2.indexOf(obj.getTemplateId())]
        let pos = obj.getPosition()
        let rot = obj.getRotation()
        let scale = obj.getScale()
        let name = obj.getName()

        obj.setObjectType(2)
        obj.destroy()

        let placeholder = world.createObjectFromTemplate(id, pos)
        placeholder.setRotation(rot)
        placeholder.setScale(scale)
        placeholder.setName(name)
    }
})*/

/*let json = {}
world.getAllObjects().forEach(function(obj, idx) {
    if (obj.constructor.name == "Container" && obj.getPosition().y > 70 && obj.getName().includes("Drink Deck"))
    {
        let info = {}
        info.name = obj.getName()
        info.numItems = obj.getNumItems()
        info.json = obj.toJSONString()

        json[obj.getName()] = info

        let num = obj.getNumItems()
    for (let i = 0; i < num; i++)
    {
        console.log("removing " + i)
        obj.removeAt(0)
    }
    }
})
//console.log(json)
console.log(JSON.stringify(json, true))*/

//characters.addCharacter(world.getObjectById("rye"))