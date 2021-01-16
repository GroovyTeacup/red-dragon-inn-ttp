/*
    Gambling mimic script.
    Features:
*/

const {refObject, world, GameObject, Player, Color} = require("@tabletop-playground/api")
const utils = require("./utils")

// We don't want more than one object on the table with this script.
if (globalThis.currentMimic && globalThis.currentMimic.isValid() && globalThis.currentMimic !== refObject)
{
    let obj = refObject
    setTimeout(() => {
        console.warn("Destroying duplicate mimic")
        obj.destroy()
    }, 0);
    return
}

// If this is a new gambling mimic, set its name/description.
if (!refObject.mimic)
{
    refObject.setName("Press R to take control of the round.")
    refObject.setDescription("This is a gambling mimic. Though inanimate, some people say it's enchanted to amplify the desires of those who gamble around it.")
}

globalThis.currentMimic = refObject
refObject.mimic = refObject.mimic || {}
const mimic = refObject.mimic

/**
 *
 *
 * @param {Player} ply
 */
function claim(ply)
{
    if (!utils.isValidGameObject(ply)) return;

    if (mimic.owner === ply)
    {
        ply.showMessage("You already have control of the round.")
        return;
    }

    world.broadcastChatMessage(utils.format("{0} has taken control of the round of gambling!", ply.getName()), ply.getPlayerColor())
    refObject.setName(utils.format("{0} currently has control of the round.", ply.getName()))

    mimic.owner = ply
    refObject.setPrimaryColor(ply.getPlayerColor())
    setTimeout(() => {
        if (mimic.owner === ply && utils.isValidGameObject(refObject))
        {
            refObject.setPrimaryColor(new Color(1,1,1,1))
        }
    }, 3000);
}

let locked = false
function lock(obj, color)
{
    locked = !locked
    world.broadcastChatMessage(utils.format("The Gambling Mimic has been {0}.", (locked ? "locked" : "unlocked")))
    createClaimButtons()
}

let nextClaim = 0
refObject.onPrimaryAction.add(function(obj, ply) {
    if (nextClaim > world.getGameTime()) {
        ply.showMessage("Do not spam the claim button!")
        return;
    }

    if (mimic.locked && ply.isHost())
    {
        ply.showMessage("The mimic is currently locked.")
        return;
    }

    claim(ply)
})