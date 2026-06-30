"""
Initial data population script
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')
django.setup()

from modules.users.models import Role, Permission
from modules.characters.models import CharacterTemplate, Profession
from modules.maps.models import Area
from modules.chapters.models import Chapter, Scene
from modules.gameplay.models import Task, Reward, Achievement
from modules.dialogue.models import NPC
from modules.stages.models import Stage, Enemy

def init_roles_and_permissions():
    """Initialize default roles and permissions"""
    print("Creating roles and permissions...")
    
    # Create roles
    admin_role, _ = Role.objects.get_or_create(name='admin', defaults={'description': '系统管理员'})
    player_role, _ = Role.objects.get_or_create(name='player', defaults={'description': '普通玩家'})
    
    # Create permissions
    permissions_data = [
        ('can_manage_users', '管理用户', 'users'),
        ('can_manage_characters', '管理角色', 'characters'),
        ('can_manage_maps', '管理地图', 'maps'),
        ('can_play_game', '玩游戏', 'gameplay'),
    ]
    
    for codename, name, module in permissions_data:
        Permission.objects.get_or_create(
            codename=codename,
            defaults={'name': name, 'module': module}
        )
    
    print(f"Created {Role.objects.count()} roles, {Permission.objects.count()} permissions")

def init_character_templates():
    """Initialize 5 cat character templates"""
    print("Creating character templates...")
    
    templates_data = [
        {'name': '橘猫', 'cat_type': '橘猫', 'personality': '贪吃懒惰但温暖', 'battle_role': '坦克',
         'base_hp': 150, 'base_attack': 8, 'base_defense': 12, 'base_agility': 3, 'base_intelligence': 5},
        {'name': '黑猫', 'cat_type': '黑猫', 'personality': '神秘高冷', 'battle_role': '刺客',
         'base_hp': 80, 'base_attack': 15, 'base_defense': 5, 'base_agility': 12, 'base_intelligence': 8},
        {'name': '白猫', 'cat_type': '白猫', 'personality': '优雅纯洁', 'battle_role': '法师',
         'base_hp': 90, 'base_attack': 12, 'base_defense': 6, 'base_agility': 7, 'base_intelligence': 15},
        {'name': '狸花猫', 'cat_type': '狸花猫', 'personality': '活泼好动', 'battle_role': '战士',
         'base_hp': 120, 'base_attack': 12, 'base_defense': 8, 'base_agility': 8, 'base_intelligence': 6},
        {'name': '暹罗猫', 'cat_type': '暹罗猫', 'personality': '聪明粘人', 'battle_role': '辅助',
         'base_hp': 100, 'base_attack': 10, 'base_defense': 7, 'base_agility': 9, 'base_intelligence': 12},
    ]
    
    for data in templates_data:
        CharacterTemplate.objects.get_or_create(
            name=data['name'],
            defaults={
                'cat_type': data['cat_type'],
                'personality': data['personality'],
                'battle_role': data['battle_role'],
                'base_hp': data['base_hp'],
                'base_attack': data['base_attack'],
                'base_defense': data['base_defense'],
                'base_agility': data['base_agility'],
                'base_intelligence': data['base_intelligence'],
                'sprite_url': f"/static/sprites/{data['cat_type']}.png"
            }
        )
    
    print(f"Created {CharacterTemplate.objects.count()} character templates")

def init_professions():
    """Initialize 4 professions"""
    print("Creating professions...")
    
    professions_data = [
        {'name': '学士', 'description': '基础研究者', 'skill_bonus': '智力+10%'},
        {'name': '硕士', 'description': '专业研究者', 'skill_bonus': '智力+15%，技能伤害+10%'},
        {'name': '博士', 'description': '高级研究者', 'skill_bonus': '智力+20%，技能伤害+20%'},
        {'name': '教授', 'description': '学术权威', 'skill_bonus': '智力+25%，技能伤害+30%，全队增益'},
    ]
    
    for data in professions_data:
        Profession.objects.get_or_create(
            name=data['name'],
            defaults={'description': data['description'], 'skill_bonus': data['skill_bonus']}
        )
    
    print(f"Created {Profession.objects.count()} professions")

def init_areas():
    """Initialize campus areas"""
    print("Creating areas...")
    
    areas_data = [
        {'name': '校园广场', 'description': '校园中心区域，有教学楼、图书馆和宿舍楼', 'order': 1, 'unlocked': True},
        {'name': '图书馆', 'description': '知识的殿堂，安静的学习场所', 'order': 2, 'unlocked': False},
        {'name': '实验室', 'description': '进行科学实验的地方', 'order': 3, 'unlocked': False},
        {'name': '操场', 'description': '运动和放松的场所', 'order': 4, 'unlocked': False},
    ]
    
    for data in areas_data:
        Area.objects.get_or_create(
            name=data['name'],
            defaults={
                'description': data['description'],
                'order': data['order'],
                'unlocked': data['unlocked'],
                'exploration_percent': 0,
                'map_url': f"/static/maps/{data['name']}.json"
            }
        )
    
    print(f"Created {Area.objects.count()} areas")

def init_chapters():
    """Initialize game chapters"""
    print("Creating chapters...")
    
    chapters_data = [
        {'name': '入学第一天', 'description': '作为新生来到校园，开始学术喵的奇幻之旅', 'order': 1, 'required_level': 1},
        {'name': '图书馆的秘密', 'description': '在图书馆发现神秘的古籍', 'order': 2, 'required_level': 5},
        {'name': '实验室危机', 'description': '实验室发生意外，需要解决危机', 'order': 3, 'required_level': 10},
    ]
    
    for data in chapters_data:
        chapter, _ = Chapter.objects.get_or_create(
            name=data['name'],
            defaults={
                'description': data['description'],
                'order': data['order'],
                'required_level': data['required_level'],
                'unlocked': data['order'] == 1
            }
        )
        
        # Create scenes for each chapter
        if not chapter.scenes.exists():
            for i in range(3):
                Scene.objects.get_or_create(
                    chapter=chapter,
                    order=i + 1,
                    defaults={
                        'name': f'{chapter.name} - 场景{i + 1}',
                        'description': f'这是{chapter.name}的第{i + 1}个场景',
                        'background_url': f"/static/backgrounds/{chapter.name}_{i+1}.jpg"
                    }
                )
    
    print(f"Created {Chapter.objects.count()} chapters with scenes")

def init_tasks():
    """Initialize sample tasks"""
    print("Creating tasks...")
    
    tasks_data = [
        {'name': '完成入学登记', 'description': '去教务处完成入学手续', 'type': 1, 'difficulty': 1, 'order': 1, 'required_level': 1},
        {'name': '认识新同学', 'description': '与3位同学对话', 'type': 1, 'difficulty': 1, 'order': 2, 'required_level': 1},
        {'name': '寻找丢失的书籍', 'description': '在图书馆找到丢失的书籍', 'type': 2, 'difficulty': 2, 'order': 3, 'required_level': 3},
    ]
    
    for data in tasks_data:
        Task.objects.get_or_create(
            name=data['name'],
            defaults={
                'description': data['description'],
                'type': data['type'],
                'difficulty': data['difficulty'],
                'order': data['order'],
                'required_level': data['required_level'],
                'objectives': {'target': 1, 'current': 0}
            }
        )
    
    print(f"Created {Task.objects.count()} tasks")

def init_rewards():
    """Initialize sample rewards"""
    print("Creating rewards...")
    
    rewards_data = [
        {'name': '新手礼包', 'coin_amount': 100, 'exp_amount': 50, 'cat_food_amount': 10},
        {'name': '升级奖励', 'coin_amount': 200, 'exp_amount': 100, 'cat_food_amount': 20},
        {'name': '成就奖励', 'coin_amount': 500, 'exp_amount': 250, 'cat_food_amount': 50},
    ]
    
    for data in rewards_data:
        Reward.objects.get_or_create(
            name=data['name'],
            defaults={
                'coin_amount': data['coin_amount'],
                'exp_amount': data['exp_amount'],
                'cat_food_amount': data['cat_food_amount']
            }
        )
    
    print(f"Created {Reward.objects.count()} rewards")

def init_enemies():
    """Initialize sample enemies"""
    print("Creating enemies...")
    
    enemies_data = [
        {'name': '流浪猫', 'level': 1, 'hp': 50, 'attack': 5, 'defense': 2, 'exp_reward': 20, 'coin_reward': 10, 'is_boss': False},
        {'name': '调皮小猫', 'level': 3, 'hp': 80, 'attack': 8, 'defense': 4, 'exp_reward': 40, 'coin_reward': 20, 'is_boss': False},
        {'name': '学术怪兽', 'level': 10, 'hp': 300, 'attack': 20, 'defense': 10, 'exp_reward': 200, 'coin_reward': 100, 'is_boss': True},
    ]
    
    for data in enemies_data:
        Enemy.objects.get_or_create(
            name=data['name'],
            defaults={
                'level': data['level'],
                'hp': data['hp'],
                'max_hp': data['hp'],
                'attack': data['attack'],
                'defense': data['defense'],
                'exp_reward': data['exp_reward'],
                'coin_reward': data['coin_reward'],
                'is_boss': data['is_boss'],
                'sprite_url': f"/static/enemies/{data['name']}.png"
            }
        )
    
    print(f"Created {Enemy.objects.count()} enemies")

def init_stages():
    """Initialize stages for each chapter"""
    print("Creating stages...")
    
    chapters = Chapter.objects.all()
    for chapter in chapters:
        if chapter.stages.exists():
            continue
        for i in range(3):
            Stage.objects.get_or_create(
                chapter=chapter,
                order=i + 1,
                defaults={
                    'name': f'{chapter.name} - 关卡{i + 1}',
                    'description': f'{chapter.name}的第{i + 1}个关卡',
                    'required_level': chapter.required_level + i,
                    'enemy_ids': [1, 2],
                    'boss_id': None if i < 2 else 3,
                    'reward_id': i + 1
                }
            )
    
    print(f"Created {Stage.objects.count()} stages")

def init_npcs():
    """Initialize sample NPCs"""
    print("Creating NPCs...")
    
    plaza = Area.objects.filter(name='校园广场').first()
    if not plaza:
        print("Warning: Plaza area not found, skipping NPCs")
        return
    
    npcs_data = [
        {'name': '教授喵', 'affinity': 0},
        {'name': '同学喵', 'affinity': 0},
        {'name': '学姐喵', 'affinity': 0},
    ]
    
    for data in npcs_data:
        NPC.objects.get_or_create(
            name=data['name'],
            defaults={
                'area': plaza,
                'avatar_url': f"/static/npcs/{data['name']}.png",
                'affinity': data['affinity'],
                'dialogues_completed': 0
            }
        )
    
    print(f"Created {NPC.objects.count()} NPCs")

def main():
    """Main initialization function"""
    print("=" * 50)
    print("Starting initial data population...")
    print("=" * 50)
    
    init_roles_and_permissions()
    init_character_templates()
    init_professions()
    init_areas()
    init_chapters()
    init_tasks()
    init_rewards()
    init_enemies()
    init_stages()
    init_npcs()
    
    print("=" * 50)
    print("Initial data population completed!")
    print("=" * 50)

if __name__ == '__main__':
    main()
