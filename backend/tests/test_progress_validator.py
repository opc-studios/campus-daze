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
