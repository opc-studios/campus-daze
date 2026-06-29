CREATE DATABASE IF NOT EXISTS campus_daze CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campus_daze;

CREATE TABLE IF NOT EXISTS users_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login DATETIME NULL,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS characters_charactertemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    cat_type VARCHAR(50) NOT NULL,
    personality VARCHAR(100) NOT NULL,
    battle_role VARCHAR(50) NOT NULL,
    base_hp INT NOT NULL,
    base_attack INT NOT NULL,
    base_defense INT NOT NULL,
    base_agility INT NOT NULL,
    base_intelligence INT NOT NULL,
    sprite_url VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS characters_profession (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    skill_bonus VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS characters_gamecharacter (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    character_template_id INT NOT NULL,
    profession_id INT NOT NULL,
    level INT DEFAULT 1,
    exp INT DEFAULT 0,
    hp INT NOT NULL,
    max_hp INT NOT NULL,
    mp INT NOT NULL,
    max_mp INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    agility INT NOT NULL,
    intelligence INT NOT NULL,
    current_form INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_user(id),
    FOREIGN KEY (character_template_id) REFERENCES characters_charactertemplate(id),
    FOREIGN KEY (profession_id) REFERENCES characters_profession(id)
);

CREATE TABLE IF NOT EXISTS characters_equipmenttemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slot INT NOT NULL,
    rarity INT DEFAULT 1,
    attack_bonus INT DEFAULT 0,
    defense_bonus INT DEFAULT 0,
    hp_bonus INT DEFAULT 0,
    mp_bonus INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS characters_equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    slot INT NOT NULL,
    equipment_template_id INT NOT NULL,
    level INT DEFAULT 1,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
    FOREIGN KEY (equipment_template_id) REFERENCES characters_equipmenttemplate(id)
);

CREATE TABLE IF NOT EXISTS characters_skilltemplate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    damage INT NOT NULL,
    mp_cost INT NOT NULL,
    cooldown INT NOT NULL,
    range INT NOT NULL,
    skill_type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS characters_skill (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    skill_template_id INT NOT NULL,
    level INT DEFAULT 1,
    cooldown_remaining INT DEFAULT 0,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
    FOREIGN KEY (skill_template_id) REFERENCES characters_skilltemplate(id)
);

CREATE TABLE IF NOT EXISTS enemies_enemy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    level INT NOT NULL,
    hp INT NOT NULL,
    max_hp INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    exp_reward INT NOT NULL,
    coin_reward INT NOT NULL,
    area_id INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS enemies_battle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    enemy_id INT NOT NULL,
    result INT DEFAULT 0,
    turn_count INT DEFAULT 0,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
    FOREIGN KEY (enemy_id) REFERENCES enemies_enemy(id)
);

CREATE TABLE IF NOT EXISTS areas_area (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    unlocked BOOLEAN DEFAULT TRUE,
    exploration_percent INT DEFAULT 0,
    `order` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS npcs_npc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    area_id INT NOT NULL,
    affinity INT DEFAULT 0,
    dialogues_completed INT DEFAULT 0,
    FOREIGN KEY (area_id) REFERENCES areas_area(id)
);

CREATE TABLE IF NOT EXISTS npcs_dialogue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    npc_id INT NOT NULL,
    text TEXT NOT NULL,
    choices TEXT DEFAULT '[]',
    next_dialogue_id INT DEFAULT NULL,
    `order` INT DEFAULT 0,
    FOREIGN KEY (npc_id) REFERENCES npcs_npc(id)
);

CREATE TABLE IF NOT EXISTS tasks_task (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    type INT DEFAULT 1,
    difficulty INT DEFAULT 1,
    objectives TEXT DEFAULT '[]',
    reward_id INT DEFAULT NULL,
    required_level INT DEFAULT 1,
    `order` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks_taskprogress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    task_id INT NOT NULL,
    progress INT DEFAULT 0,
    status INT DEFAULT 0,
    completed_at DATETIME NULL,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
    FOREIGN KEY (task_id) REFERENCES tasks_task(id)
);

CREATE TABLE IF NOT EXISTS rewards_reward (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    coin_amount INT DEFAULT 0,
    exp_amount INT DEFAULT 0,
    cat_food_amount INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rewards_achievement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    condition VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards_characterachievement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at DATETIME NULL,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id),
    FOREIGN KEY (achievement_id) REFERENCES rewards_achievement(id)
);

CREATE TABLE IF NOT EXISTS rest_restrecord (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    coins_earned INT DEFAULT 0,
    exp_earned INT DEFAULT 0,
    cat_food_earned INT DEFAULT 0,
    FOREIGN KEY (character_id) REFERENCES characters_gamecharacter(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_user(id)
);

INSERT INTO characters_charactertemplate (name, cat_type, personality, battle_role, base_hp, base_attack, base_defense, base_agility, base_intelligence) VALUES
('莉娜', '白色长毛猫', '温柔治愈型学术喵', '辅助/治疗/控场', 120, 15, 12, 10, 20),
('阿宇', '狸花猫', '勇敢均衡型学术喵', '近战/输出/机动', 100, 22, 10, 18, 10),
('知夏', '布偶猫', '睿智学术型魔法喵', '远程/法术/爆发', 80, 25, 8, 12, 25),
('江寻', '虎斑猫(丛林型)', '灵活善型战斗喵', '远程/物理/大范围', 90, 20, 9, 20, 12),
('老登', '蓝猫', '强力近战型力量喵', '近战/坦克/控制', 150, 18, 18, 8, 8);

INSERT INTO characters_profession (name, description, skill_bonus) VALUES
('学霸', '稳定法术输出', '公式光束、远程压制'),
('学渣', '逆袭坦克', '错题护盾、残血爆发'),
('卷王', '高速连击', 'DDL冲锋、经验加成'),
('课代表', '辅助治疗', '点名鼓舞、团队增益');

INSERT INTO areas_area (name, description, unlocked, exploration_percent, `order`) VALUES
('新生广场', '校园主广场，樱花盛开的地方', TRUE, 100, 1),
('教学楼', '知识的殿堂，考试的战场', TRUE, 0, 2),
('樱花大道', '浪漫的樱花步道', FALSE, 0, 3),
('医学院', '神秘的实验楼', FALSE, 0, 4),
('图书馆', '知识的海洋', FALSE, 0, 5);

INSERT INTO enemies_enemy (name, level, hp, max_hp, attack, defense, exp_reward, coin_reward, area_id) VALUES
('协议怪', 3, 80, 80, 12, 5, 50, 30, 2),
('拖延症魔', 5, 120, 120, 18, 8, 80, 50, 2),
('考试幽灵', 8, 200, 200, 25, 12, 150, 100, 4),
('论文怪兽', 10, 300, 300, 35, 15, 200, 150, 5);

INSERT INTO npcs_npc (name, area_id, affinity) VALUES
('校长喵', 1, 0),
('教导主任喵', 2, 0),
('图书管理员喵', 5, 0);

INSERT INTO tasks_task (name, description, type, difficulty, objectives, required_level, `order`) VALUES
('初入校园', '与校长喵对话，了解校园概况', 1, 1, '["与校长喵对话"]', 1, 1),
('第一次战斗', '击败一只协议怪', 1, 1, '["击败1只协议怪"]', 1, 2),
('探索教学楼', '探索教学楼区域', 1, 2, '["探索教学楼至50%"]', 3, 3);

INSERT INTO rewards_reward (name, coin_amount, exp_amount, cat_food_amount) VALUES
('新手礼包', 100, 50, 5),
('任务奖励', 50, 100, 0),
('战斗胜利', 30, 50, 1);

INSERT INTO rewards_achievement (name, description, condition) VALUES
('初出茅庐', '完成第一次战斗', 'battle_count >= 1'),
('知识探索者', '探索所有区域', 'exploration_percent >= 100'),
('任务达人', '完成10个任务', 'task_count >= 10'),
('校园之星', '角色达到20级', 'level >= 20');