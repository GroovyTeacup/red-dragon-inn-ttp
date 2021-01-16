const drinks = require("./drinks.json")
const {world, GameObject, Vector, Rotator} = require("@tabletop-playground/api")

let lastDeck

function rand(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min))
}

function emptyContainer(obj)
{
    if (!obj.getNumItems) throw 'Invalid Container'

    let num = obj.getNumItems()
    for (let i = 0; i < num; i++)
    {
        obj.removeAt(0)
    }
}

function lastDeckExists() 
{
    return lastDeck !== null && lastDeck !== undefined && lastDeck.isValid() && !lastDeck.isInHand()
}


/**
 * Constructs JSON string of a random drink deck inside of a container.
 *
 * @param {String} containerJSON - JSON object of a container that has individual cards stored inside of it.
 * @returns {String} JSON string for a container that has a randomized drink deck inside.
 */
function constructRandomDrinkDeck(containerJSON, num) {
    // Get the Array of JSON strings for the items contained in the passed containerJSON.
    // By default, this is the "Random Drink Deck" container we have stored inside of drinks.json
    let items = containerJSON.itemsJson
    // After we've got the items, reset this Array.
    containerJSON.itemsJson = []

    let cardStack // Define cardStack

    for (let i = 0; i < num; i++) {
        let num = rand(0, items.length - 1) // Generate a random number in the range of how many items are in the array.
        let card = items[num] // Get the random card

        // If this is the first card we're picking, make it the "base" for this card stack.
        if (i == 0) {

            // Parse the card's JSON, and define/clear stackSerialization just to be sure it's ready for us to use.
            // This is now the base object for the card stack.
            cardStack = JSON.parse(card)
            cardStack.stackSerialization = []
        } else {
            // Same thing, just parse the card's JSON. 
            let json = JSON.parse(card)

            // Push the parsed card's index & templateId to the cardStack's stackSerialization array.
            // Cards in a stack are stored by their card index and template id, rather than serializing the entire object like TTS.
            cardStack.stackSerialization.push({
                index: json.atlasIndex,
                templateId: json.templateId
            })
        }
    }

    // Convert our new deck into a string and store it into itemsJson
    containerJSON.itemsJson.push(JSON.stringify(cardStack))

    // Convert container json to string and return.
    return JSON.stringify(containerJSON)
}

module.exports = {
    /**
     * Find a drink deck by name and return its JSON object
     *
     * @param {String} text - Name of the drink deck. Ex; "Drink Deck 1"
     * @returns {Object} JSON Object
     */
    getDrinkDeck: function(text)
    {
        for (let tbl in decks)
        {
            if (tbl.name.contains(text))
            {
                return decks[tbl.name]
            }
        }
    },

    addDrinkDeck: function(obj) 
    {
        if (!obj || !obj.isValid() || obj.constructor.name != "Container") throw "Invalid object. Must exist and be a container."

        let tbl = {}
        tbl.name = obj.getName()
        tbl.numItems = obj.getNumItems()
        tbl.json = obj.toJSONString()

        console.log(JSON.stringify(tbl))
        console.log("Copy this JSON and make a new entry for it in characters.json. Remove existing entry if updating.")

        drinks[tbl.name] = tbl

        return tbl
    },

    spawnDrinkDeck: function(text, pos)
    {
        let deck = this.getCharacter()

        return world.createObjectFromJSON(deck.json, pos)
    },

    /**
     * Find all drink deck containers on the table and add events to give them functionality.
     *
     * @param {Vector} drinkDeckPos - The position drink decks will be dropped at. This spot basically https://i.imgur.com/SRZj8GN.png
     */
    propagateDrinkDeckContainerEvents: function(drinkDeckPos)
    {
        let objs = world.getAllObjects()
        let names = Object.keys(drinks) // Get an Array of keys in our drinks.json file. In this case, it's the drink deck names.

        // Loop through all objects in the world.
        objs.forEach((obj, idx, arr) => {
            if (names.indexOf(obj.getName()) != -1) // If the object name matches any of the drink deck names, continue.
            {
                // Make sure this object is a container and isn't one that's been spawned by the player.
                if (!obj.isValid() || obj.getContainer() != null || obj.constructor.name != "Container" || obj.spawnedContainer || obj.getDescription() == "!!!") return

                obj.drinkDeck = drinks[obj.getName()]
                obj.spawnPos = obj.getPosition()
                obj.spawnRot = obj.getRotation()

                // Make container penetrable
                obj.setObjectType(2)

                // Make sure players can't muck up the containers
                obj.onTick.add(function(obj, dt) {
                    obj.setPosition(obj.spawnPos)
                    obj.setRotation(obj.spawnRot)
                    obj.setLinearVelocity(new Vector(0, 0, 0))

                    // If the container ends up in another container, take it out.
                    if (obj.getContainer() != null) 
                    {
                        let container = obj.getContainer()
                        container.takeAt(container.getItems().indexOf(obj), obj.spawnPos)
                    }
                })

                obj.onPrimaryAction.add(function(obj, ply) {
                    let pos = drinkDeckPos
                    // Is this a random drink deck?
                    let isRandom = obj.drinkDeck.name == "Random Drink Deck"
                    // If this is a random drink deck, construct it first. Otherwise, use stored pre-set JSON for regular drink decks.
                    let json = isRandom && constructRandomDrinkDeck(JSON.parse(drinks["Random Drink Deck"]["json"]), 30) || obj.drinkDeck.json
                    let container


                    // Create our container that has our deck inside of it.
                    container = world.createObjectFromJSON(json, pos.subtract(new Vector(9, 0, 0)))

                    container.setRotation(new Rotator(0, -180, 0)) // Correct rotation
                    container.spawnedContainer = true
                    container.setDescription("!!!") // Unsure if this actually works 100% of the time; Had weird issues with it.

                    // We want to only take out the cards after the container has been dropped where it should be.
                    setTimeout(() => {
                        if (container && container.isValid())
                        {
                            // Take our deck out of the container.
                            let deck = container.takeAt(0, pos)

                            // Running this on next tick because otherwise for some ungodly reason this results in 'deck' being undefined sometimes
                            process.nextTick(function() {
                                // Make sure it's actually valid, otherwise fuck it
                                if (!deck || !deck.isValid()) return

                                // Correct rotation
                                deck.setRotation(new Rotator(0, -90, 0))

                                // Is there a deck already here?
                                if (lastDeckExists()) 
                                {
                                    // If so, add newly created deck to the existing one & shuffle.
                                    lastDeck.addCards(deck)
                                    lastDeck.shuffle()
                                }
                                else
                                {
                                    // Otherwise, shuffle new deck.
                                    deck.shuffle()
                                    lastDeck = deck
                                }
                            })                            
                        }
                    }, 500);
                })

                // When the host grabs one of the containers, let them know to press R to use it.
                obj.onGrab.add(function(obj, ply) {
                    if (!ply.isHost()) return // If the player isn't the host, don't notify them.
                     
                    ply.sendChatMessage("Press R on the container to spawn this drink deck.", new Color(1, 0, 0, 1))
                    ply.showMessage("Press R on the container to spawn this drink deck.")
                })

                //console.log("Propagated events for ", obj.getName())
            }
        })

        console.log("Propagated drink deck container events.")
    }
}