from pydantic import BaseModel
from typing import Optional

class TaskProgressUpdate(BaseModel):
    progress: int