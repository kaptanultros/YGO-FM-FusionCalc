var cardInput = document.getElementById("hand");
var cardHand = document.getElementById("cardsHand");
var cardBoard = document.getElementById("cardBoard");
var outputLeft = document.querySelector("#outputarealeft .inner");
var outputRight = document.querySelector("#outputarearight .inner");
var cards = [];
var monsters = [];
var others = [];

// Initialize Awesomplete
var _awesompleteOpts = {
    list: card_db()
        .get()
        .map((c) => c.Name), // List is all the cards in the DB
    autoFirst: true, // The first item in the list is selected
    filter: Awesomplete.FILTER_STARTSWITH, // Case insensitive from start of word
};
var hand = document.getElementById("hand");
new Awesomplete(hand, _awesompleteOpts);

function cardsToHtml(cards, summon = false) {
    var divToFill = cardHand;
    if (summon) {
        divToFill = cardBoard;
    }
    divToFill.innerHTML = "";
    cards.map((card) => {
        var res = $("<div>", {
            class: "jumbotron card position-relative grid-5 px-2 py-2 pb-4",
            id: "card-" + card.Id,
        });
        res.append(checkCard(card));
        res.append(
            "<span class='remove' title='Remove card' onclick='removeCard(" + card.Id + ", this)'>X</span>"
        );
        divToFill.append(res[0]);
    });
}

function removeCard(cardId, el = null) {
    if (el && el.parentElement.parentElement.id === "cardBoard") {
        for (id in monsters) {
            if (monsters[id].Id == cardId) {
                monsters.splice(id, 1);
            }
        }
        el.parentElement.remove();
    } else {
        for (id in cards) {
            if (cards[id].Id == cardId) {
                cards.splice(id, 1);
            }
        }
        cardsToHtml(cards);
    }
    resultsClear();
    findFusions();
}

// Creates a div for each fusion
function fusesToHTML(fuselist) {
    return fuselist
        .map(function (fusion) {
            var res = "<div class='fusion'>"
            if (fusion.result) {
                // Equips and Results don't have a result field
                res += "<br><strong>Result: " + fusion.result.Name + "</strong>";
			}
            res += "<br><strong>Input:</strong> " +
					fusion.card1.Name +
					"<br><strong>Input:</strong> " +
					fusion.card2.Name;
            if (fusion.result) {
                // Equips and Results don't have a result field
                //res += "<br><strong>Result: " + fusion.result.Name + "</strong>";
                if (isMonster(fusion.result)) {
					res += "<br><strong>Guardian Stars: " + starNames[fusion.result.GuardianStarA] + ", " + starNames[fusion.result.GuardianStarB] + "</strong>"
                    res += " " + formatStats(fusion.result.Attack, fusion.result.Defense);
                } else {
                    res += " [" + cardTypes[fusion.result.Type] + "]";
                }
                res +=
                    "<span onclick='summonFusion(" +
                    fusion.card1.Id +
                    "," +
                    fusion.card2.Id +
                    "," +
                    fusion.result.Id +
                    ");' class='summon' title='Summon fusion'>🌟</span>";
            }
            return res + "<br><br></div>";
        })
        .join("\n");
}

function summonFusion(card1, card2, fusion) {
    removeCard(card1);
    removeCard(card2);
    findFusions(fusion, true);
}

function getCardByName(cardname) {
    return card_db({ Name: { isnocase: cardname } }).first();
}

// Returns the card with a given ID
function getCardById(id) {
    var card = card_db({ Id: id }).first();
    if (!card) {
        return null;
    }
    return card;
}

function formatStats(attack, defense) {
    var res = "<div class='row position-absolute bottom-0 left-0 w-100 px-3 m-0 power'>";
    res += "<div class='text-left col px-0'>🗡️ " + attack + "</div>";
    res += "<div class='text-right col px-0'>🛡️ " + defense + "</div>";
    res += "</div>";
    return res;
}

// Returns true if the given card is a monster, false if it is magic, ritual,
// trap or equip
function isMonster(card) {
    return card.Type < 20;
}

function checkCard(card) {
    if (!card) {
        return "Invalid card name";
        return;
    }
    var info = $("#card-" + card.Id);
    if (isMonster(card)) {
        var res = [
            "<div class='position-relative w-100'>" + card.Name + "</div>",
            "<div class='position-relative w-100'><small>[" + cardTypes[card.Type] + "]</small></div>",
            "<div class='desc'>",
            "<div class='position-relative w-100 text-justify'><small><em>" +
                card.Description +
                "</em></small></div>",
            "</div>",
            formatStats(card.Attack, card.Defense),
        ];
        return res.join("\r\n");
    } else {
        var res = [
            "<div class='position-relative w-100'>" + card.Name + "</div>",
            "<div class='position-relative w-100'><small>[" + cardTypes[card.Type] + "]</small></div>",
            "<div class='desc'>",
            "<div class='position-relative w-100 text-justify'><small><em>" +
                card.Description +
                "</em></small></div>",
            "</div>",
        ];
        return res.join("\r\n");
    }
}

// Checks if the given card is in the list of fusions
// Assumes the given card is an Object with an "Id" field
// TODO: Generalize to take Object, Name (string) or Id (int)
function hasFusion(fusionList, card) {
    return fusionList.some((c) => c.Id === card.Id);
}

function findFusions(fusion = null, summon = false) {
    if (!fusion) {
        var name = cardInput.value;
        var card = getCardByName(name);
    } else {
        var card = getCardById(fusion);
    }
    if (card) {
        if (summon) {
            monsters.push(card);
        } else {
            cards.push(card);
        }
    }

    var fuses = [];
    var equips = [];

    var totalCards = cards.concat(monsters);

    for (i = 0; i < totalCards.length - 1; i++) {
        var card1 = totalCards[i];
        var card1Fuses = fusionsList[card1.Id];
        var card1Equips = equipsList[card1.Id];
        for (j = i + 1; j < totalCards.length; j++) {
            var card2 = totalCards[j];
            var fusion = card1Fuses.find((f) => f.card === card2.Id);
            if (fusion) {
                fuses.push({ card1: card1, card2: card2, result: getCardById(fusion.result) });
            }
            var equip = card1Equips.find((e) => e === card2.Id);
            if (equip) {
                equips.push({ card1: card1, card2: card2 });
            }
        }
    }

    if (summon) {
        cardsToHtml(monsters, summon);
    } else {
        cardsToHtml(cards, summon);
    }

    outputLeft.innerHTML += fusesToHTML(fuses.sort((a, b) => b.result.Attack - a.result.Attack));

    outputRight.innerHTML += fusesToHTML(equips);
}

function resultsClear() {
    outputLeft.innerHTML = "";
    outputRight.innerHTML = "";
}

$("#hand").on("awesomplete-selectcomplete", function () {
    resultsClear();
    findFusions();
    // checkCard(this.value, this.id + "-info");
    this.value = "";
});
// }

$("#resetBtn").on("click", function () {
    cards = [];
    monsters = [];
    cardsToHtml(cards);
    resultsClear();
    cardBoard.innerHTML = "";
});

new Sortable(cardHand, {
    group: "shared", // set both lists to same group
    animation: 150,
});

new Sortable(cardBoard, {
    group: "shared",
    animation: 150,
});
