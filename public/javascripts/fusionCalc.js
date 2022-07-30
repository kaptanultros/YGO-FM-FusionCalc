var cardInput = document.getElementById("hand");
var cardHand = document.getElementById("cardsHand");
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

function cardsToHtml(cards) {
    var cardsHTML = cards
        .map((card) => {
            var res =
                "<div class='jumbotron position-relative grid-5 px-2 py-2 pb-4' id='card-" + card.Id + "' >";
            res += checkCard(card);
            res += "<span class='remove' onclick='removeCard(" + card.Id + ")'>X</span>";
            res += "</div>";
            return res;
        })
        .join("\n");

    cardHand.innerHTML = cardsHTML;
}

function removeCard(cardId) {
    for (id in cards) {
        if (cards[id].Id == cardId) {
            cards.splice(id, 1);
        }
    }
    cardsToHtml(cards);
    resultsClear();
    findFusions();
}

// Creates a div for each fusion
function fusesToHTML(fuselist) {
    return fuselist
        .map(function (fusion) {
            var res =
                "<div class='result-div'><strong>Input:</strong> " +
                fusion.card1.Name +
                "<br><strong>Input:</strong> " +
                fusion.card2.Name;
            if (fusion.result) {
                // Equips and Results don't have a result field
                res += "<br><strong>Result:</strong> " + fusion.result.Name;
                if (isMonster(fusion.result)) {
                    res += " " + formatStats(fusion.result.Attack, fusion.result.Defense);
                } else {
                    res += " [" + cardTypes[fusion.result.Type] + "]";
                }
            }
            return res + "<br><br></div>";
        })
        .join("\n");
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

function findFusions() {
    var name = cardInput.value;
    var card = getCardByName(name);
    if (card) {
        cards.push(card);
    }

    var fuses = [];
    var equips = [];

    for (i = 0; i < cards.length - 1; i++) {
        var card1 = cards[i];
        var card1Fuses = fusionsList[card1.Id];
        var card1Equips = equipsList[card1.Id];
        for (j = i + 1; j < cards.length; j++) {
            var card2 = cards[j];
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

    cardsToHtml(cards);

    outputLeft.innerHTML += fusesToHTML(fuses.sort((a, b) => b.result.Attack - a.result.Attack));

    outputRight.innerHTML += fusesToHTML(equips);
}

function resultsClear() {
    outputLeft.innerHTML = "";
    outputRight.innerHTML = "";
}

// Set up event listeners for each card input
// for (i = 1; i <= 5; i++) {
// $("#hand").on("change", function () {
//     handCompletions[this.id].select(); // select the currently highlighted element
//     if (this.value === "") {
//         // If the box is cleared, remove the card info
//         $("#" + this.id + "-info").html("");
//     } else {
//         checkCard(this.value, this.id + "-info");
//     }
//     resultsClear();
//     // findFusions();
// });

$("#hand").on("awesomplete-selectcomplete", function () {
    resultsClear();
    findFusions();
    // checkCard(this.value, this.id + "-info");
    this.value = "";
});
// }

$("#resetBtn").on("click", function () {
    cards = [];
    cardsToHtml(cards);
    resultsClear();
});
