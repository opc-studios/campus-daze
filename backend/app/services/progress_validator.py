from typing import Any


class ProgressValidator:
    def validate(self, old_state: dict, new_state: dict) -> dict:
        errors = []
        
        old_credits = old_state.get("resources", {}).get("credits", 0)
        new_credits = new_state.get("resources", {}).get("credits", 0)
        if new_credits < old_credits:
            errors.append("学分不能减少")
        
        old_role_id = old_state.get("player", {}).get("roleId")
        new_role_id = new_state.get("player", {}).get("roleId")
        if old_role_id and new_role_id and old_role_id != new_role_id:
            errors.append("角色 ID 不可变更")
        
        old_level = old_state.get("player", {}).get("level", 1)
        new_level = new_state.get("player", {}).get("level", 1)
        if new_level < old_level:
            errors.append("等级不能降低")
        
        old_chapter = old_state.get("progress", {}).get("currentChapter", 0)
        new_chapter = new_state.get("progress", {}).get("currentChapter", 0)
        if new_chapter < old_chapter:
            errors.append("章节不能回退")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors if errors else None
        }
