from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


class RoleId(str, Enum):
    lina = "lina"
    ayu = "ayu"
    zhixia = "zhixia"
    jiangxun = "jiangxun"
    laodeng = "laodeng"


class FormType(str, Enum):
    human = "human"
    cat = "cat"


class CombatRole(str, Enum):
    summon_spirit = "summon_spirit"
    dps_strike = "dps_strike"
    dps_burst = "dps_burst"
    dps_aoe = "dps_aoe"
    tank_heavy = "tank_heavy"


class IdleTask(str, Enum):
    study = "study"
    intern = "intern"


class CombatState(str, Enum):
    idle = "idle"
    init = "init"
    running = "running"
    skipped = "skipped"
    end = "end"
    settlement = "settlement"


class CombatResult(str, Enum):
    win = "win"
    lose = "lose"
    flee = "flee"


class MonsterState(str, Enum):
    patrol = "patrol"
    alert = "alert"
    chase = "chase"
    combat = "combat"
    cleared = "cleared"
    return_state = "return"


class Position(BaseModel):
    x: float
    y: float


class Attrs(BaseModel):
    knowledge: int
    practice: int
    insight: int
    resilience: int


class CombatStats(BaseModel):
    critRate: float
    critDamage: float
    evasionRate: float
    accuracyRate: float


class PlayerState(BaseModel):
    name: str
    roleId: RoleId
    currentForm: FormType
    combatRole: CombatRole
    level: int
    exp: int
    attrs: Attrs
    combatStats: CombatStats
    unlockedSkills: list[str]
    equippedSkills: list[Optional[str]]


class ResourcesState(BaseModel):
    credits: int
    coins: int


class IdleState(BaseModel):
    task: IdleTask
    startedAt: int
    lastClaimedAt: int


class ProgressState(BaseModel):
    currentChapter: int
    chapterCleared: list[bool]
    chapterCredits: int
    clearedNodes: list[str]
    seenEvents: list[str]
    archives: list[str]


class MapState(BaseModel):
    currentMapId: str
    playerPosition: Position
    formSwitchAllowed: bool
    revealedRegions: list[str]
    completedNodes: list[str]
    nodeCooldowns: dict[str, int]


class MonsterInfo(BaseModel):
    nodeId: str
    monsterId: str
    state: MonsterState
    position: Position
    patrolAnchor: Position
    alertRadius: float
    leashRadius: float
    failCount: int


class CombatInfo(BaseModel):
    state: CombatState
    speed: Literal[1, 2]
    canSkip: bool
    skipped: bool
    result: Optional[CombatResult] = None
    lastResult: Optional[dict] = None


class Reward(BaseModel):
    type: str
    amount: int
    itemId: Optional[str] = None


class GameState(BaseModel):
    player: PlayerState
    resources: ResourcesState
    idle: IdleState
    progress: ProgressState
    map: MapState
    monsters: dict[str, MonsterInfo]
    combat: CombatInfo
    inventory: dict[str, int]
    equipped: dict[str, Optional[str]]
