from dataclasses import dataclass
from typing import Optional

@dataclass
class DetectiveSetDTO:
    id: int
    id_owner: int
    main_detective: str
    action_secret: str
    is_cancellable: bool
    wildcard_effects: Optional[str] = None