# apps/backend/app/schemas/groups.py
from typing import Any, Optional

try:
    # Pydantic v2
    from pydantic import BaseModel, ConfigDict
    _V2 = True
except Exception:
    # Pydantic v1
    from pydantic import BaseModel  # type: ignore
    _V2 = False

class GroupPublic(BaseModel):
    # Champs minimaux ; on autorise des champs supplémentaires pour ne rien casser
    id: Any | None = None
    name: Optional[str] = None
    description: Optional[str] = None

    if _V2:
        model_config = ConfigDict(from_attributes=True, extra="allow", arbitrary_types_allowed=True)
    else:
        class Config:
            orm_mode = True
            extra = "allow"
            arbitrary_types_allowed = True
