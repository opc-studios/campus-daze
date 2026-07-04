class ProgressValidator:
    """存档写入校验：学分、技能解锁、等级边界、章节回退等。

    依据：技术设计 §7.4.5、§3.2.2、§8、§10.3。
    """

    MAX_CHAPTERS = 4
    MAX_LEVEL = 60
    MAX_EQUIPPED_SLOTS = 3
    S2_CREDITS_THRESHOLD = 8

    def validate(self, old_state: dict, new_state: dict) -> dict:
        errors: list[str] = []

        # D.3 二周目继承豁免：检测 ngPlusCount 递增时跳过不可撤回字段校验
        # 允许 chapterCleared/clearedNodes/seenEvents/chapterChoices/currentChapter 重置
        ng_plus_triggered = self._is_new_game_plus(old_state, new_state)

        self._validate_resources(old_state, new_state, errors, ng_plus_triggered)
        self._validate_player(old_state, new_state, errors)
        self._validate_progress(old_state, new_state, errors, ng_plus_triggered)
        self._validate_skills(old_state, new_state, errors)
        self._validate_map(old_state, new_state, errors, ng_plus_triggered)

        return {
            "valid": len(errors) == 0,
            "errors": errors if errors else None,
        }

    def _is_new_game_plus(self, old_state: dict, new_state: dict) -> bool:
        """检测当前写入是否为开启二周目：new.ngPlusCount > old.ngPlusCount。

        GDD §6.7：开启二周目时允许章节进度归零，但需保留 archives/skills 等继承项。
        """
        old_prog = old_state.get("progress", {}) or {}
        new_prog = new_state.get("progress", {}) or {}
        old_ng = old_prog.get("ngPlusCount", 0) or 0
        new_ng = new_prog.get("ngPlusCount", 0) or 0
        return new_ng > old_ng

    def _validate_resources(self, old_state: dict, new_state: dict, errors: list[str],
                            ng_plus_triggered: bool = False) -> None:
        old_res = old_state.get("resources", {}) or {}
        new_res = new_state.get("resources", {}) or {}

        old_credits = old_res.get("credits", 0) or 0
        new_credits = new_res.get("credits", 0) or 0
        # D.3 NG+ 豁免：开启二周目时允许 credits 归零（继承部分作为 bonusCredits 注入）
        if not ng_plus_triggered and new_credits < old_credits:
            errors.append("学分不能减少")

        old_coins = old_res.get("coins", 0) or 0
        new_coins = new_res.get("coins", 0) or 0
        # D.3 NG+ 豁免：开启二周目时允许 coins 归零（继承部分作为 bonusCoins 注入）
        if not ng_plus_triggered and new_coins < old_coins:
            errors.append("校园币不能减少")

    def _validate_player(self, old_state: dict, new_state: dict, errors: list[str]) -> None:
        old_player = old_state.get("player", {}) or {}
        new_player = new_state.get("player", {}) or {}

        old_role_id = old_player.get("roleId")
        new_role_id = new_player.get("roleId")
        if old_role_id and new_role_id and old_role_id != new_role_id:
            errors.append("角色 ID 不可变更")

        old_level = old_player.get("level", 1) or 1
        new_level = new_player.get("level", 1) or 1
        if new_level < old_level:
            errors.append("等级不能降低")
        if new_level > self.MAX_LEVEL:
            errors.append(f"等级超过上限 {self.MAX_LEVEL}")

        old_form = old_player.get("currentForm")
        new_form = new_player.get("currentForm")
        if new_form is not None and new_form not in ("human", "cat"):
            errors.append("currentForm 取值非法")

        equipped_skills = new_player.get("equippedSkills", []) or []
        if len(equipped_skills) > self.MAX_EQUIPPED_SLOTS:
            errors.append(f"装备技能槽数量超过 {self.MAX_EQUIPPED_SLOTS}")

    def _validate_progress(self, old_state: dict, new_state: dict, errors: list[str],
                          ng_plus_triggered: bool = False) -> None:
        old_prog = old_state.get("progress", {}) or {}
        new_prog = new_state.get("progress", {}) or {}

        old_chapter = old_prog.get("currentChapter", 0) or 0
        new_chapter = new_prog.get("currentChapter", 0) or 0
        # D.3 NG+ 豁免：开启二周目时允许 currentChapter 归零
        if not ng_plus_triggered and new_chapter < old_chapter:
            errors.append("章节不能回退")
        if new_chapter >= self.MAX_CHAPTERS:
            errors.append("章节索引越界")

        old_cleared = old_prog.get("chapterCleared") or []
        new_cleared = new_prog.get("chapterCleared") or []
        if new_cleared and len(new_cleared) != self.MAX_CHAPTERS:
            errors.append(f"chapterCleared 长度必须为 {self.MAX_CHAPTERS}")
        elif new_cleared and old_cleared and not ng_plus_triggered:
            # D.3 NG+ 豁免：开启二周目时允许 chapterCleared 重置为 false
            for i, (old_v, new_v) in enumerate(zip(old_cleared, new_cleared)):
                if old_v and not new_v:
                    errors.append(f"第 {i + 1} 章通关状态不能撤回")

        chapter_endings = new_prog.get("chapterEndings") or []
        if chapter_endings and len(chapter_endings) != self.MAX_CHAPTERS:
            errors.append(f"chapterEndings 长度必须为 {self.MAX_CHAPTERS}")

        old_archives = old_prog.get("archives", []) or []
        new_archives = new_prog.get("archives", []) or []
        # D.3 NG+ 不豁免 archives：GDD §6.7 明确二周目必须保留图鉴收集
        for archive_id in old_archives:
            if archive_id not in new_archives:
                errors.append("校史图鉴不能丢失")
                break

        old_cleared_nodes = old_prog.get("clearedNodes", []) or []
        new_cleared_nodes = new_prog.get("clearedNodes", []) or []
        # D.3 NG+ 豁免：开启二周目时允许 clearedNodes 重置
        if not ng_plus_triggered:
            for node_id in old_cleared_nodes:
                if node_id not in new_cleared_nodes:
                    errors.append("已通关节点不能撤回")
                    break

        old_seen_events = old_prog.get("seenEvents", []) or []
        new_seen_events = new_prog.get("seenEvents", []) or []
        # D.3 NG+ 豁免：开启二周目时允许 seenEvents 重置
        if not ng_plus_triggered:
            for event_id in old_seen_events:
                if event_id not in new_seen_events:
                    errors.append("已触发事件不能撤回")
                    break

        # B.9: gameCompleted 不可撤回（一旦通关不可逆转）
        # D.3 NG+ 豁免：开启二周目时允许 gameCompleted 重置为 false
        old_completed = old_prog.get("gameCompleted", False) or False
        new_completed = new_prog.get("gameCompleted", False) or False
        if not ng_plus_triggered and old_completed and not new_completed:
            errors.append("gameCompleted 不可撤回")

        # gameCompleted=true 时 chapterCleared[3] 必须为 true（终章必须通关）
        if new_completed:
            cleared = new_prog.get("chapterCleared") or []
            if len(cleared) >= self.MAX_CHAPTERS and not cleared[self.MAX_CHAPTERS - 1]:
                errors.append("gameCompleted=true 但终章未通关")

        # B.9: 单调递增字段校验（studyTimeSeconds/exploreCount/eventTriggerCount 不可降低）
        # D.3 NG+ 豁免：开启二周目时这些累计统计允许重置
        if not ng_plus_triggered:
            for field in ("studyTimeSeconds", "exploreCount", "eventTriggerCount"):
                old_v = old_prog.get(field, 0) or 0
                new_v = new_prog.get(field, 0) or 0
                if new_v < old_v:
                    errors.append(f"{field} 不可降低")

        # B.9: chapterChoices 不可撤回（已记录的选择不可改，0 表示未记录）
        # D.3 NG+ 豁免：开启二周目时允许 chapterChoices 重置
        if not ng_plus_triggered:
            old_choices = old_prog.get("chapterChoices") or [0, 0, 0, 0]
            new_choices = new_prog.get("chapterChoices") or [0, 0, 0, 0]
            for i, (old_c, new_c) in enumerate(zip(old_choices, new_choices)):
                if old_c != 0 and new_c != old_c:
                    errors.append(f"chapterChoices[{i}] 已记录不可更改")
                    break

    def _validate_skills(self, old_state: dict, new_state: dict, errors: list[str]) -> None:
        """校验装备的技能是否在解锁池内（防作弊）。"""
        new_player = new_state.get("player", {}) or {}
        new_prog = new_state.get("progress", {}) or {}

        role_id = new_player.get("roleId")
        if not role_id:
            return

        unlocked = self._get_unlocked_skill_ids(role_id, new_prog)
        equipped_skills = new_player.get("equippedSkills", []) or []
        for slot in equipped_skills:
            if slot is None:
                continue
            if slot not in unlocked:
                errors.append(f"装备了未解锁的技能：{slot}")

        old_unlocked = new_player.get("unlockedSkills", []) or []
        for skill_id in old_unlocked:
            if skill_id not in unlocked:
                errors.append(f"技能池含未解锁技能：{skill_id}")
                break

    def _validate_map(self, old_state: dict, new_state: dict, errors: list[str],
                      ng_plus_triggered: bool = False) -> None:
        old_map = old_state.get("map", {}) or {}
        new_map = new_state.get("map", {}) or {}

        old_revealed = old_map.get("revealedRegions", []) or []
        new_revealed = new_map.get("revealedRegions", []) or []
        # D.3 NG+ 豁免：开启二周目时允许 revealedRegions 重置
        if not ng_plus_triggered:
            for region in old_revealed:
                if region not in new_revealed:
                    errors.append("已揭示区域不能重新隐藏")
                    break

        old_completed = old_map.get("completedNodes", []) or []
        new_completed = new_map.get("completedNodes", []) or []
        # D.3 NG+ 豁免：开启二周目时允许 completedNodes 重置
        if not ng_plus_triggered:
            for node_id in old_completed:
                if node_id not in new_completed:
                    errors.append("已完成地图节点不能撤回")
                    break

    def _get_unlocked_skill_ids(self, role_id: str, progress: dict) -> list[str]:
        ids = [f"{role_id}_basic"]
        chapter_cleared = progress.get("chapterCleared", []) or []
        chapter_credits = progress.get("chapterCredits", 0) or 0
        current_chapter = progress.get("currentChapter", 0) or 0

        if current_chapter >= 1:
            ids.append(f"{role_id}_s1")
        if chapter_credits >= self.S2_CREDITS_THRESHOLD or (chapter_cleared and chapter_cleared[0]):
            ids.append(f"{role_id}_s2")
        if chapter_cleared and chapter_cleared[0]:
            ids.append(f"{role_id}_s3")
        if chapter_cleared and len(chapter_cleared) > 1 and chapter_cleared[1]:
            ids.append(f"{role_id}_s4")
        if chapter_cleared and len(chapter_cleared) > 2 and chapter_cleared[2]:
            ids.append(f"{role_id}_s5")
        return ids
