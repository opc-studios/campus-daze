from pydantic import BaseModel

class DialogueResponse(BaseModel):
    choice_id: int