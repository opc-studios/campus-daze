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
    # 章节结局：每章 0=未触发 / 1=普通 / 2=隐藏；4 章
    chapterEndings: list[int] = [0, 0, 0, 0]
    # B.9 新增 5 字段（与前端 types/game.ts 对齐）
    studyTimeSeconds: int = 0
    exploreCount: int = 0
    eventTriggerCount: int = 0
    chapterChoices: list[int] = [0, 0, 0, 0]
    gameCompleted: bool = False
    # D.3 二周目继承：周目数（0=首周目，每次开启二周目递增）
    ngPlusCount: int = 0


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
    # 当前血量（None=未进入战斗/满血）
    currentHp: Optional[int] = None
    # 是否锁定玩家为追击目标
    targetPlayer: bool = False


class CombatInfo(BaseModel):
    state: CombatState
    speed: Literal[1, 2]
    canSkip: bool
    skipped: bool
    result: Optional[CombatResult] = None
    lastResult: Optional[dict] = None
    # 当前战斗中的目标玩家怪物 ID（GDD §10.3）
    targetPlayer: Optional[str] = None
    # 当前战斗中的怪物 ID（GDD §10.3）
    monsterId: Optional[str] = None


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
