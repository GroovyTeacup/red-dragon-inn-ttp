const {world, globalEvents, refObject, GameObject, Vector, Rotator, Color} = require("@tabletop-playground/api")
const utils = require("./utils")

const goldTemplate = "F52206E84279316FE39D008AC9BB3A4A"

const goldStacks = []

for (let i = 0; i < 10; i++)
{
    let obj = world.getObjectById("goldStack" + (i + 1))
    goldStacks[i] = obj
}

let goldStackTemplateId = "77B4ACE84F2216C5F93553BE872D306F"

function goldStackOnTick(obj, dt)
{
    obj.setPosition(obj.spawnPos)
    obj.setRotation(obj.spawnRot)

    // If the gold ends up in another container, take it out.
    if (obj.getContainer() != null) 
    {
        let container = obj.getContainer()
        container.takeAt(container.getItems().indexOf(obj), obj.spawnPos)
    }
}

goldStacks.forEach(o => {
    if (o.getTemplateId() == goldStackTemplateId && o.getContainer() == null)
    {
        o.spawnPos = o.getPosition()
        o.spawnRot = o.getRotation()
        o.onTick.add(goldStackOnTick)
    }
})

function getPlayerGoldStack(ply)
{
    return goldStacks[ply.getSlot()]
}

function getGoldOnBoard()
{
    let gold = []
    world.getAllObjects().forEach((obj) => {
        if (obj.getTemplateId() != goldTemplate) return
        
        let pos = refObject.getPosition()
        let extent = refObject.getExtent().add(new Vector(0, 0, 10))

        if (obj.getPosition().isInBox(pos, extent))
        {
            gold.push(obj)
        }
    })

    return gold
}

function sendToInn(obj)
{
    let innContainer = world.getObjectById("innContainer")

    if (!utils.isValidGameObject(innContainer)) 
    {
        world.broadcastChatMessage("Couldn't find the inn container!", new Color(1, 0, 0, 1))
        return
    }

    if (!utils.isValidGameObject(obj)) throw "Invalid GameObject"

    innContainer.insert([obj], 0)
    innContainer.removeAt(0)
}

globalEvents.onChatMessage.add(function(ply, msg) {
    if (msg.startsWith("!inn"))
    {
        let innContainer = world.getObjectById("innContainer")

        if (!utils.isValidGameObject(innContainer)) 
        {
            world.broadcastChatMessage("Couldn't find the inn container!", new Color(1, 0, 0, 1))
            return
        }

        let objs = getGoldOnBoard()

        objs.forEach(sendToInn)

        world.broadcastChatMessage(objs.length + " gold has been sent to the inn!", new Color(0, 1, 0, 1))
    } 
    else if (msg.startsWith("!pot"))
    {
        let stack = getPlayerGoldStack(ply)
        if (!stack)
        {
            ply.sendChatMessage("Couldn't find your gold stack!", new Color(1, 0, 0, 1))
            return
        }

        let objs = getGoldOnBoard()
        objs.forEach(obj => {
            stack.insert([obj], 0)
        })
        world.broadcastChatMessage(utils.format("{0} has claimed the pot of {1} gold!", ply.getName(), objs.length), new Color(0, 1, 0, 1))
    }
    else if (msg.startsWith("!tip"))
    {
        let stack = getPlayerGoldStack(ply)
        if (!stack)
        {
            ply.sendChatMessage("Couldn't find your gold stack!", new Color(1, 0, 0, 1))
            return
        }

        if (stack.getNumItems() == 0)
        {
            ply.sendChatMessage("Couldn't find any gold to tip with in your gold stack!", new Color(1, 0, 0, 1))
            return
        }

        let obj = stack.takeAt(0, stack.getPosition().add(new Vector(0, 0, 10)))
        process.nextTick(ms => {
            if (utils.isValidGameObject(obj))
            {
                sendToInn(obj)
            }
        })
    }
})