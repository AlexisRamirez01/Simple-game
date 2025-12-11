""" Card utilities """

from src.cards.models import SecretCard
from src.cards.models import Card
from src.cards.schemas import CardOut
from src.cards.schemas import SecretCardOut
from src.cards.schemas import DetectiveCardDTO
from src.cards.models import DetectiveCard
from src.cards.schemas import DetectiveCardOut



def db_card_2_card_out(db_card: Card) -> CardOut:
    """
    Converts a Database card into a response schema

    Parameters
    ----------
    db_contact : Card
        Database Card

    Returns
    -------
    CardOut
        Card schema for response
    """

    return CardOut(
        id=db_card.id,
        name=db_card.name,
        description=db_card.description,
        image_url=db_card.image_url,
        is_murderes_escapes=db_card.is_murderes_escapes
        
    )

def db_secretcard_2_secretcard_out(db_card: SecretCard) -> SecretCardOut:
    """
    Converts a Database card into a response schema

    Parameters
    ----------
    db_contact : Card
        Database Card

    Returns
    -------
    SecretCard
        Card schema for response
    """

    return SecretCardOut(
        id=db_card.id,
        name=db_card.name,
        description=db_card.description,
        image_url=db_card.image_url,
        is_murderes_escapes=db_card.is_murderes_escapes,
        is_murderer=db.is_murderer,
        is_accomplice=db.is_accomplice,
        is_revealed=db.is_revealed,
     
    )

def db_detectivecard_2_detectivecard_out(db_card: DetectiveCard) -> DetectiveCardOut:
    
    return DetectiveCardOut(
        id=db_card.id,
        name=db_card.name,
        description=db_card.description,
        image_url=db_card.image_url,
        is_murderes_escapes=db_card.is_murderes_escapes,
        requiredAmount=db.requiredAmount,

    )