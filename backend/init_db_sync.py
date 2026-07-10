import sqlite3
import bcrypt
import os

DB_PATH = "./test.db"

def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            nickname VARCHAR(50) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE game_saves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            slot INTEGER NOT NULL DEFAULT 1,
            state_json TEXT NOT NULL,
            state_version INTEGER NOT NULL DEFAULT 1,
            role_id VARCHAR(50),
            schema_version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, slot)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE game_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type VARCHAR(50) NOT NULL,
            entity_key VARCHAR(100) NOT NULL,
            image_type VARCHAR(50) NOT NULL,
            mime_type VARCHAR(50),
            image_data BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entity_type, entity_key, image_type)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE revoked_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            refresh_token_jti VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE email_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(100) NOT NULL,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE game_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value TEXT NOT NULL,
            content TEXT,
            content_hash VARCHAR(255),
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    hashed_password = bcrypt.hashpw("123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor.execute('''
        INSERT INTO users (username, password_hash, email, nickname, is_active)
        VALUES (?, ?, ?, ?, ?)
    ''', ('test', hashed_password, 'test@test.com', '测试用户', 1))
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")
    print("Test user created: username=test, password=123456")

if __name__ == "__main__":
    init_db()