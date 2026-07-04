"""
数值平衡验证脚本
检查角色、技能、怪物、章节配置的数值合理性
"""
import json
import sys
from pathlib import Path

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_roles(roles):
    """验证角色属性平衡性"""
    print("=== 角色属性验证 ===")
    for role in roles:
        attrs = role['baseAttrs']
        total = sum(attrs.values())
        main_attr = role['mainAttr']
        main_value = attrs[main_attr]
        
        print(f"{role['name']} ({role['roleId']}):")
        print(f"  总属性: {total}, 主属性: {main_attr}={main_value}")
        
        if main_value != 8:
            print(f"  ⚠️ 警告: 主属性值不是8")
        if total != 23:
            print(f"  ⚠️ 警告: 总属性不是23")

def validate_skills(skills):
    """验证技能倍率合理性"""
    print("\n=== 技能倍率验证 ===")
    skills_by_role = {}
    for skill in skills:
        role_id = skill['roleId']
        if role_id not in skills_by_role:
            skills_by_role[role_id] = []
        skills_by_role[role_id].append(skill)
    
    for role_id, role_skills in skills_by_role.items():
        print(f"\n{role_id}:")
        # 被动技能无 cooldown 字段，使用 .get 容错
        for skill in sorted(role_skills, key=lambda x: x.get('cooldown', 0)):
            skill_type = skill.get('type', 'unknown')
            cd = skill.get('cooldown', '-')
            mult = skill.get('multiplier', '-')
            print(f"  {skill['name']} ({skill_type}): 倍率={mult}, CD={cd}")

            if skill_type == 'basic' and skill.get('multiplier') != 1.0:
                print(f"    ⚠️ 警告: 普攻倍率不是1.0")
            if skill_type == 'active' and skill.get('multiplier', 1.0) < 1.0:
                print(f"    ⚠️ 警告: 主动技能倍率过低")

def validate_monsters(monsters):
    """验证怪物属性曲线"""
    print("\n=== 怪物属性验证 ===")
    monsters_by_chapter = {}
    for monster in monsters:
        chapter = monster['chapter']
        if chapter not in monsters_by_chapter:
            monsters_by_chapter[chapter] = []
        monsters_by_chapter[chapter].append(monster)
    
    for chapter in sorted(monsters_by_chapter.keys()):
        print(f"\n第{chapter}章:")
        for monster in sorted(monsters_by_chapter[chapter], key=lambda x: x['hp']):
            is_boss = monster.get('isBoss', False)
            prefix = "[BOSS] " if is_boss else ""
            print(f"  {prefix}{monster['name']}: HP={monster['hp']}, ATK={monster['atk']}, DEF={monster['def']}")
            
            if not is_boss:
                if monster['hp'] > 300:
                    print(f"    ⚠️ 警告: 普通怪物HP过高")
                if monster['atk'] > 50:
                    print(f"    ⚠️ 警告: 普通怪物ATK过高")

def validate_chapters(chapters):
    """验证章节学分里程碑"""
    print("\n=== 章节学分验证 ===")
    for chapter in chapters:
        print(f"第{chapter['chapterId']}章 {chapter['name']}: 学分目标={chapter['creditMilestone']}")
        
        if chapter['chapterId'] > 0:
            prev_milestone = chapters[chapter['chapterId'] - 1]['creditMilestone']
            diff = chapter['creditMilestone'] - prev_milestone
            print(f"  需要 {diff} 学分解锁下一章")

def validate_rewards(monsters):
    """验证奖励数值"""
    print("\n=== 奖励数值验证 ===")
    total_exp = 0
    total_credits = 0
    total_coins = 0
    
    for monster in monsters:
        rewards = monster.get('rewards', {})
        exp = rewards.get('exp', 0)
        credits = rewards.get('credits', 0)
        coins = rewards.get('coins', 0)
        
        total_exp += exp
        total_credits += credits
        total_coins += coins
    
    print(f"所有怪物总奖励:")
    print(f"  经验: {total_exp}")
    print(f"  学分: {total_credits}")
    print(f"  校园币: {total_coins}")
    
    if total_credits < 120:
        print(f"  ⚠️ 警告: 总学分不足以达到120毕业要求")

def validate_combat_duration_nfr(monsters):
    """
    R 战斗时长 NFR 校验（GDD §3.2.2）：
    - 普通怪物 TTK: 10-35 秒
    - Boss TTK: 45-75 秒
    估算模型：DPS = max(player_atk * 0.6 - monster_def * 0.3, 5)
    """
    print("\n=== 战斗时长 NFR 验证（GDD §3.2.2）===")
    # 各章节假设玩家 ATK（中位养成水平）
    chapter_player_atk = {1: 30, 2: 45, 3: 60, 4: 75}
    nfr_min = {'normal': 10, 'boss': 45}
    nfr_max = {'normal': 35, 'boss': 75}

    violations = 0
    for monster in monsters:
        chapter = monster['chapter']
        is_boss = monster.get('isBoss', False)
        kind = 'boss' if is_boss else 'normal'
        player_atk = chapter_player_atk.get(chapter, 30)
        monster_def = monster.get('def', 0)
        monster_hp = monster.get('hp', 0)

        # 简化 DPS 估算：玩家攻击力 * 0.6（含技能倍率与 CD 综合平均）减去 30% 护甲穿透后剩余护甲抵消
        dps = max(player_atk * 0.6 - monster_def * 0.3, 5)
        ttk = monster_hp / dps

        status = '✓' if (nfr_min[kind] <= ttk <= nfr_max[kind]) else '⚠️ 超出 NFR'
        if not (nfr_min[kind] <= ttk <= nfr_max[kind]):
            violations += 1
        prefix = '[BOSS] ' if is_boss else ''
        print(f"  {prefix}{monster['name']} (Ch{chapter}): HP={monster_hp}, DEF={monster_def}, DPS≈{dps:.1f}, TTK≈{ttk:.1f}s [{nfr_min[kind]}-{nfr_max[kind]}] {status}")

    print(f"\n  违规数: {violations}/{len(monsters)}")


def main():
    config_dir = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'game' / 'config'
    
    if not config_dir.exists():
        print(f"错误: 配置目录不存在: {config_dir}")
        sys.exit(1)
    
    roles = load_json(config_dir / 'roles.json')
    skills = load_json(config_dir / 'skills.json')
    monsters = load_json(config_dir / 'monsters.json')
    chapters = load_json(config_dir / 'chapters.json')
    
    validate_roles(roles)
    validate_skills(skills)
    validate_monsters(monsters)
    validate_chapters(chapters)
    validate_rewards(monsters)
    validate_combat_duration_nfr(monsters)
    
    print("\n=== 验证完成 ===")

if __name__ == '__main__':
    main()
