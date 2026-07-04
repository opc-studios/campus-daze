import pytest
from app.services.progress_validator import ProgressValidator


def test_credits_cannot_decrease():
    validator = ProgressValidator()
    
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    new_state = {
        "resources": {"credits": 80, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "学分不能减少" in result["errors"]


def test_role_id_cannot_change():
    validator = ProgressValidator()
    
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "ayu", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "角色 ID 不可变更" in result["errors"]


def test_level_cannot_decrease():
    validator = ProgressValidator()
    
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 3},
        "progress": {"currentChapter": 1}
    }
    
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "等级不能降低" in result["errors"]


def test_chapter_cannot_go_back():
    validator = ProgressValidator()
    
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 2}
    }
    
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }
    
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "章节不能回退" in result["errors"]


def test_valid_state_transition():
    validator = ProgressValidator()

    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {"currentChapter": 1}
    }

    new_state = {
        "resources": {"credits": 120, "coins": 60},
        "player": {"roleId": "lina", "level": 6},
        "progress": {"currentChapter": 2}
    }

    result = validator.validate(old_state, new_state)
    assert result["valid"]
    assert result["errors"] is None


# ========== B.9 新规则测试 ==========

def test_game_completed_cannot_revert():
    """B.9: gameCompleted 一旦为 true 不可撤回。"""
    validator = ProgressValidator()
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 60},
        "progress": {
            "currentChapter": 3,
            "chapterCleared": [True, True, True, True],
            "gameCompleted": True,
        },
    }
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 60},
        "progress": {
            "currentChapter": 3,
            "chapterCleared": [True, True, True, True],
            "gameCompleted": False,  # 撤回
        },
    }
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "gameCompleted 不可撤回" in result["errors"]


def test_game_completed_requires_final_chapter_cleared():
    """B.9: gameCompleted=true 时终章必须通关。"""
    validator = ProgressValidator()
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 60},
        "progress": {"currentChapter": 3, "gameCompleted": False},
    }
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 60},
        "progress": {
            "currentChapter": 3,
            "chapterCleared": [True, True, True, False],  # 终章未通关
            "gameCompleted": True,
        },
    }
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "gameCompleted=true 但终章未通关" in result["errors"]


def test_monotonic_fields_cannot_decrease():
    """B.9: studyTimeSeconds/exploreCount/eventTriggerCount 不可降低。"""
    validator = ProgressValidator()
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {
            "currentChapter": 1,
            "studyTimeSeconds": 3600,
            "exploreCount": 10,
            "eventTriggerCount": 5,
        },
    }
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {
            "currentChapter": 1,
            "studyTimeSeconds": 1800,  # 降低
            "exploreCount": 10,
            "eventTriggerCount": 5,
        },
    }
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "studyTimeSeconds 不可降低" in result["errors"]


def test_chapter_choices_cannot_change():
    """B.9: chapterChoices 已记录不可更改（0 表示未记录）。"""
    validator = ProgressValidator()
    old_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {
            "currentChapter": 1,
            "chapterChoices": [1, 0, 0, 0],  # 第一章已记录选择 1
        },
    }
    new_state = {
        "resources": {"credits": 100, "coins": 50},
        "player": {"roleId": "lina", "level": 5},
        "progress": {
            "currentChapter": 1,
            "chapterChoices": [2, 0, 0, 0],  # 改为 2
        },
    }
    result = validator.validate(old_state, new_state)
    assert not result["valid"]
    assert "chapterChoices[0] 已记录不可更改" in result["errors"]
