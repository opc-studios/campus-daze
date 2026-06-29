import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

USE_SQLITE = os.getenv('USE_SQLITE', 'True').lower() == 'true'

if USE_SQLITE:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
    DB_PORT = os.getenv('DB_PORT', '3306')
    DB_NAME = os.getenv('DB_NAME', 'campus_daze')
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_sqlite_tables():
    if not USE_SQLITE:
        return
    
    db = SessionLocal()
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS users_user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                is_staff BOOLEAN DEFAULT 0,
                is_superuser BOOLEAN DEFAULT 0,
                last_login DATETIME NULL,
                date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS characters_charactertemplate (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                cat_type VARCHAR(50) NOT NULL,
                personality VARCHAR(100) NOT NULL,
                battle_role VARCHAR(50) NOT NULL,
                base_hp INTEGER NOT NULL,
                base_attack INTEGER NOT NULL,
                base_defense INTEGER NOT NULL,
                base_agility INTEGER NOT NULL,
                base_intelligence INTEGER NOT NULL,
                sprite_url VARCHAR(255) DEFAULT ''
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS characters_profession (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(200) NOT NULL,
                skill_bonus VARCHAR(100) NOT NULL
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS characters_gamecharacter (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name VARCHAR(50) NOT NULL,
                character_template_id INTEGER NOT NULL,
                profession_id INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL,
                mp INTEGER NOT NULL,
                max_mp INTEGER NOT NULL,
                attack INTEGER NOT NULL,
                defense INTEGER NOT NULL,
                agility INTEGER NOT NULL,
                intelligence INTEGER NOT NULL,
                current_form INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users_user(id),
                FOREIGN KEY (character_template_id) REFERENCES characters_charactertemplate(id),
                FOREIGN KEY (profession_id) REFERENCES characters_profession(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS characters_equipmenttemplate (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                slot INTEGER NOT NULL,
                rarity INTEGER DEFAULT 1,
                attack_bonus INTEGER DEFAULT 0,
                defense_bonus INTEGER DEFAULT 0,
                hp_bonus INTEGER DEFAULT 0,
                mp_bonus INTEGER DEFAULT 0
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS characters_equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id INTEGER NOT NULL,
                slot INTEGER NOT NULL,
                equipment_template_id INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
                FOREIGN KEY (equipment_template_id) REFERENCES characters_equipmenttemplate(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS enemies_enemy (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                level INTEGER NOT NULL,
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL,
                attack INTEGER NOT NULL,
                defense INTEGER NOT NULL,
                exp_reward INTEGER NOT NULL,
                coin_reward INTEGER NOT NULL,
                area_id INTEGER DEFAULT NULL
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS areas_area (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(200) NOT NULL,
                unlocked BOOLEAN DEFAULT 1,
                exploration_percent INTEGER DEFAULT 0,
                `order` INTEGER DEFAULT 0
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS npcs_npc (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                area_id INTEGER NOT NULL,
                affinity INTEGER DEFAULT 0,
                dialogues_completed INTEGER DEFAULT 0,
                FOREIGN KEY (area_id) REFERENCES areas_area(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS npcs_dialogue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                npc_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                choices TEXT DEFAULT '[]',
                next_dialogue_id INTEGER DEFAULT NULL,
                `order` INTEGER DEFAULT 0,
                FOREIGN KEY (npc_id) REFERENCES npcs_npc(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks_task (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(200) NOT NULL,
                type INTEGER DEFAULT 1,
                difficulty INTEGER DEFAULT 1,
                objectives TEXT DEFAULT '[]',
                reward_id INTEGER DEFAULT NULL,
                required_level INTEGER DEFAULT 1,
                `order` INTEGER DEFAULT 0
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks_taskprogress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id INTEGER NOT NULL,
                task_id INTEGER NOT NULL,
                progress INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                completed_at DATETIME NULL,
                FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
                FOREIGN KEY (task_id) REFERENCES tasks_task(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS rewards_reward (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                coin_amount INTEGER DEFAULT 0,
                exp_amount INTEGER DEFAULT 0,
                cat_food_amount INTEGER DEFAULT 0
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS rewards_achievement (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                description VARCHAR(200) NOT NULL,
                condition VARCHAR(200) NOT NULL
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS rest_restrecord (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NULL,
                coins_earned INTEGER DEFAULT 0,
                exp_earned INTEGER DEFAULT 0,
                cat_food_earned INTEGER DEFAULT 0,
                FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id)
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users_user(id)
            )
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO characters_charactertemplate (id, name, cat_type, personality, battle_role, base_hp, base_attack, base_defense, base_agility, base_intelligence) VALUES
            (1, '莉娜', '白色长毛猫', '温柔治愈型学术喵', '辅助/治疗/控场', 120, 15, 12, 10, 20),
            (2, '阿宇', '狸花猫', '勇敢均衡型学术喵', '近战/输出/机动', 100, 22, 10, 18, 10),
            (3, '知夏', '布偶猫', '睿智学术型魔法喵', '远程/法术/爆发', 80, 25, 8, 12, 25),
            (4, '江寻', '虎斑猫(丛林型)', '灵活善型战斗喵', '远程/物理/大范围', 90, 20, 9, 20, 12),
            (5, '老登', '蓝猫', '强力近战型力量喵', '近战/坦克/控制', 150, 18, 18, 8, 8)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO characters_profession (id, name, description, skill_bonus) VALUES
            (1, '学霸', '稳定法术输出', '公式光束、远程压制'),
            (2, '学渣', '逆袭坦克', '错题护盾、残血爆发'),
            (3, '卷王', '高速连击', 'DDL冲锋、经验加成'),
            (4, '课代表', '辅助治疗', '点名鼓舞、团队增益')
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO areas_area (id, name, description, unlocked, exploration_percent, `order`) VALUES
            (1, '新生广场', '校园主广场，樱花盛开的地方', 1, 100, 1),
            (2, '教学楼', '知识的殿堂，考试的战场', 1, 0, 2),
            (3, '樱花大道', '浪漫的樱花步道', 0, 0, 3),
            (4, '医学院', '神秘的实验楼', 0, 0, 4),
            (5, '图书馆', '知识的海洋', 0, 0, 5)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO enemies_enemy (id, name, level, hp, max_hp, attack, defense, exp_reward, coin_reward, area_id) VALUES
            (1, '协议怪', 3, 80, 80, 12, 5, 50, 30, 2),
            (2, '拖延症魔', 5, 120, 120, 18, 8, 80, 50, 2),
            (3, '考试幽灵', 8, 200, 200, 25, 12, 150, 100, 4),
            (4, '论文怪兽', 10, 300, 300, 35, 15, 200, 150, 5)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO npcs_npc (id, name, area_id, affinity) VALUES
            (1, '校长喵', 1, 0),
            (2, '教导主任喵', 2, 0),
            (3, '图书管理员喵', 5, 0)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO tasks_task (id, name, description, type, difficulty, objectives, required_level, `order`) VALUES
            (1, '初入校园', '与校长喵对话，了解校园概况', 1, 1, '["与校长喵对话"]', 1, 1),
            (2, '第一次战斗', '击败一只协议怪', 1, 1, '["击败1只协议怪"]', 1, 2),
            (3, '探索教学楼', '探索教学楼区域', 1, 2, '["探索教学楼至50%"]', 3, 3)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO rewards_reward (id, name, coin_amount, exp_amount, cat_food_amount) VALUES
            (1, '新手礼包', 100, 50, 5),
            (2, '任务奖励', 50, 100, 0),
            (3, '战斗胜利', 30, 50, 1)
        """))
        
        db.execute(text("""
            INSERT OR IGNORE INTO rewards_achievement (id, name, description, condition) VALUES
            (1, '初出茅庐', '完成第一次战斗', 'battle_count >= 1'),
            (2, '知识探索者', '探索所有区域', 'exploration_percent >= 100'),
            (3, '任务达人', '完成10个任务', 'task_count >= 10'),
            (4, '校园之星', '角色达到20级', 'level >= 20')
        """))
        
        db.commit()
        logger.info("SQLite tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize SQLite tables: {e}")
        db.rollback()
    finally:
        db.close()