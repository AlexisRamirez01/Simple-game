from enum import Enum

class RolEnum(str, Enum):
    innocent = "innocent"
    murderer = "murderer"
    accomplice = "accomplice"
    detective = "detective"