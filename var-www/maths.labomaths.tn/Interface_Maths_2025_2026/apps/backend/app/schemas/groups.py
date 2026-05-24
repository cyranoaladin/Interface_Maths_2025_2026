from typing import Optional

try:
    from pydantic import BaseModel, ConfigDict
    _V2 = True
except Exception:
    from pydantic import BaseModel
    _V2 = False

class GroupPublic(BaseModel):
    id: int | None = None
    code: str
    name: str | None = None

    if _V2:
        model_config = ConfigDict(from_attributes=True)
    else:
        class Config:
            orm_mode = True
