BASE_URL = "http://localhost:8000/static"

cards_data = [
    {
        "name": "event_onemore",
        "description": "Choose one revealed secret card and add it, face-down, to any player's secrets, including your own. This may remove social disgrace.",
        "image_url": f"{BASE_URL}/event_onemore.png",
        "is_murderes_escapes": False
    },
    {
        "name": "Instant_notsofast",
        "description": "Play this card at any time, even if it is not your turn. It cancels an action before it is taken, unless otherwise stated, including cancelling another 'Not so Fast...' card.",
        "image_url": f"{BASE_URL}/Instant_notsofast.png",
        "is_murderes_escapes": False
    },
    {
        "name": "devious_blackmailed",
        "description": "If you have received this card from another player, you must shown them one secret card of their choice, before returning it face-down to your secrets. This action cannot be cancelled by a 'Not so Fast...' card. This card can only be used during a Card Trade or a Dead Card Folly.",
        "image_url": f"{BASE_URL}/devious_blackmailed.png",
        "is_murderes_escapes": False
    },
    {
        "name": "murder_escapes",
        "description": "The Murderer wins the game.",
        "image_url": f"{BASE_URL}/murder_escapes.png",
        "is_murderes_escapes": True
    },
    {
        "name": "event_deadcardfolly",
        "description": "All players must pass one card from their hand, face-down, to the player on their right or left. The active player decides which direction. You may ask for a card of your choice, but beware you may be tricked.",
        "image_url": f"{BASE_URL}/event_deadcardfolly.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_tommyberesford",
        "description": "Choose a player, who must reveal a secret card of your choice. If a Tommy and a Tuppence are in the same set, the action cannot be cancelled by a 'Not so Fast...' card.",
        "image_url": f"{BASE_URL}/detective_tommyberesford.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_cardsonthetable",
        "description": "Choose a player, who must discard all the 'Not so Fast...' cards in their hand. The action cannot be cancelled by a 'Not so Fast...' card.",
        "image_url": f"{BASE_URL}/event_cardsonthetable.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_cardtrade",
        "description": "Choose another player and exchange one card from your hand with them. They cannot refuse. You may ask for a card of your choice, but beware you may be tricked.",
        "image_url": f"{BASE_URL}/event_cardtrade.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_pointsuspicions",
        "description": "The active player counts down: 3-2-1. Then all players must point at the person they suspect as the Murderer. The active player break ties. The most suspected player must reveal a secret card of their choice.",
        "image_url": f"{BASE_URL}/event_pointsuspicions.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_anothervictim",
        "description": "Take any existing set from another player and play it in front of you. You now own this set.",
        "image_url": f"{BASE_URL}/event_anothervictim.png",
        "is_murderes_escapes": False
    },
    {
        "name": "secret_murderer",
        "description": "If this card is revealed, you are caught and have lost the game. If the Murderer Escapes! card is revealed, you get away with murder and win the game!",
        "image_url": f"{BASE_URL}/secret_murderer.png",
        "is_murderes_escapes": False,
        "is_murderer": True,
        "is_accomplice": False
    },
    {
        "name": "devious_fauxpas",
        "description": "If you have received this card from another player, you must reveal a secret card of your choice. This card can only be used during a Card Trade or a Dead Card Folly.",
        "image_url": f"{BASE_URL}/devious_fauxpas.png",
        "is_murderes_escapes": False
    },
    {
        "name": "secret_accomplice",
        "description": "If the Murderer escapes, you both win the game, even if this card is revealed! However, if the Murderer is revealed you both lose the game.",
        "image_url": f"{BASE_URL}/secret_accomplice.png",
        "is_murderes_escapes": False,
        "is_murderer": False,
        "is_accomplice": True
    },
    {
        "name": "detective_satterthwaite",
        "description": "Choose a player, who must reveal a secret card of your choice. If this set is played with a Harley Quin Wildcard, add the revealed secret card, face-down, to your secrets.",
        "image_url": f"{BASE_URL}/detective_satterthwaite.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_earlytrain",
        "description": "Take the top six cards from the draw pile and place them face-up on the discard pile, then remove this card from the game. Discarding this card is treated the same as if you had played it.",
        "image_url": f"{BASE_URL}/event_earlytrain.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_tuppenceberesford",
        "description": "Choose a player, who must reveal a secret card of your choice. If a Tommy and a Tuppence are in the same set, the action cannot be cancelled by a 'Not so Fast...' card.",
        "image_url": f"{BASE_URL}/detective_tuppenceberesford.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_pyne",
        "description": "Instead of revealing a secret card, flip any face-up secret card face-down. This may remove social disgrace.",
        "image_url": f"{BASE_URL}/detective_pyne.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_poirot",
        "description": "Choose a player, who must reveal a secret card of their choice.",
        "image_url": f"{BASE_URL}/detective_poirot.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_oliver",
        "description": "Add to any existing set on the table. The player owning the set must reveal a secret card of their choice. May only be added, and not played as a set.",
        "image_url": f"{BASE_URL}/detective_oliver.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_marple",
        "description": "Choose a player, who must reveal a secret card of your choice.",
        "image_url": f"{BASE_URL}/detective_marple.png",
        "is_murderes_escapes": False
    },
    {
        "name": "event_delayescape",
        "description": "Take up to five cards from the top of the discard pile and place them face-down on the draw pile in any order, then remove this card from the game.",
        "image_url": f"{BASE_URL}/event_delayescape.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_brent",
        "description": "Choose a player who must reveal a secret card of their choice. If cancelled by a 'Not so fast...' card, return the detective set to your hand.",
        "image_url": f"{BASE_URL}/detective_brent.png",
        "is_murderes_escapes": False
    },
    {
        "name": "detective_quin",
        "description": "Play in conjunction with any original detective card to play a set in front of you.",
        "image_url": f"{BASE_URL}/detective_quin.png",
        "is_murderes_escapes": False
    },
    {
        "name": "secret_back",
        "description": "This is a secret card.",
        "image_url": f"{BASE_URL}/card_back.png",
        "is_murderes_escapes": False,
        "is_murderer": False,
        "is_accomplice": False
    },
    {
        "name": "event_lookashes",
        "description": "You may look though the top five cards of the discard pile and take one into your hand.",
        "image_url": f"{BASE_URL}/event_lookashes.png",
        "is_murderes_escapes": False
    }
]

cantidades = {
    "secret_accomplice": 1,
    "secret_murderer": 1,
    "secret_back": 16,
    "detective_quin": 4,
    "detective_oliver": 3,
    "detective_marple": 3,
    "detective_pyne": 3,
    "detective_tommyberesford": 2,
    "detective_brent": 3,
    "detective_tuppenceberesford": 2,
    "detective_poirot": 3,
    "detective_satterthwaite": 2,
    "Instant_notsofast": 10,
    "devious_blackmailed": 1,
    "devious_fauxpas": 3,
    "event_delayescape": 3,
    "event_pointsuspicions": 3,
    "event_deadcardfolly": 3,
    "event_anothervictim": 2,
    "event_lookashes": 3,
    "event_cardtrade": 3,
    "event_onemore": 2,
    "event_earlytrain": 2,
    "event_cardsonthetable": 1,
    "murder_escapes": 1
}

expanded_cards = []
for card in cards_data:
    cantidad = cantidades.get(card["name"])
    expanded_cards.extend([card.copy() for _ in range(cantidad)])
