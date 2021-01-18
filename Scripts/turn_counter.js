const  {GameObject, world, globalEvents, Vector} = require("@tabletop-playground/api");

function placeOnHand(object, player, offset) {
    let holder = player.getHandHolder();

    let pos;
    if (holder !== undefined) {
        pos = holder.getRotation().rotateVector(offset).add(holder.getExtentCenter());
        object.setRotation(holder.getRotation());
    } else {
        pos = new Vector(0, 0, -20);
    }

    object.setObjectType(2);
    object.setPosition(pos);
    object.toggleLock();
}

function getNextPlayer(object, player) {
    let next = player.getSlot() + 1;
    let nextPlayer = world.getPlayerBySlot()
    while (nextPlayer === undefined || nextPlayer.getHandHolder() === undefined) {
        nextPlayer = world.getPlayerBySlot(++next);

        if (next > 18) {
            next = 0;
        }

        if (object.skip[next]) {
            next++;
        }

        if (nextPlayer === player) {
            return player;
        }
    }
    return nextPlayer;
}

function setPlayer(object, player, mode, offset) {
    object.currPlayer = player;

    switch (mode) {
        case "state" :
            object.setState(player.getSlot());
            break;
        case "color" :
            object.setPrimaryColor(player.getPlayerColor());
            break;
        default:
            break;
    }

    placeOnHand(object, player, offset);
}

function toggleSkip(object, slot) {
    object.skip[slot] = !object.skip[slot];
    return object.skip[slot];
}

function isSkipping(object, slot) {
    return object.skip[slot];
}

function makeTurnCounter(object, offset, mode = "color", passButton = 1, skipButton = 2, timeout = 30000) {
    try {
        setPlayer(object, world.getAllPlayers()[0], mode, offset);
    } catch (err) {
        console.log("Error: failed to find a card container while initializing, continuing.");
    }
    object.waitPlayer = null;

    object.skip = [false, false, false, false, false, false, false, false, false, false];

    globalEvents.onScriptButtonReleased.add(function(player, button) {
        if (button === passButton && !object.skip[player.getSlot()]) {
            if (player === object.currPlayer) {
                if (object.waitPlayer != null) {
                    object.currPlayer.showMessage("Turn transferred.");
                    object.waitPlayer = null;
                    setPlayer(object, object.waitPlayer, mode, offset);
                    object.currPlayer.showMessage("It's your turn.");
                } else {
                    object.currPlayer.showMessage("Turn ended.");
                    setPlayer(object, getNextPlayer(object, object.currPlayer), mode, offset);
                    object.currPlayer.showMessage("It's your turn.");
                }
            } else if (timeout > 0 && object.waitPlayer == null) {
                object.currPlayer.showMessage("Player ".concat(
                    player.getName(), " wants to take their turn, press scripting key ",
                    passButton.toString(), " to transfer turn."));

                object.waitPlayer = player;
                setTimeout(function() {
                    object.waitPlayer = null;
                }, timeout);
            }
        }
    });

    if (skipButton < 10 && skipButton >= 0) {
        globalEvents.onScriptButtonReleased.add(function(player, button) {
            if (button === skipButton) {
                object.skip[player.getSlot()] = !object.skip[player.getSlot()];
                if (object.skip[player.getSlot()]) {
                    player.showMessage("Enabled turn skipping.");
                }
                else {
                    player.showMessage("Disabled turn skipping.");
                }
            }
        });
    }
}

makeTurnCounter(refObject, new Vector(0, 0, 30), "color", 1, 2);