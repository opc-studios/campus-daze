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
        for skill in sorted(role_skills, key=lambda x: x['cooldown']):
            print(f"  {skill['name']}: 倍率={skill['multiplier']}, CD={skill['cooldown']}")
            
            if skill['type'] == 'basic' and skill['multiplier'] != 1.0:
                print(f"    ⚠️ 警告: 普攻倍率不是1.0")
            if skill['type'] == 'active' and skill['multiplier'] < 1.0:
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
    
    print("\n=== 验证完成 ===")

if __name__ == '__main__':
    main()
