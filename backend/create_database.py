import pymysql
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)

load_dotenv()

DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
DB_PORT = int(os.getenv('DB_PORT', '3306'))

try:
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset='utf8mb4'
    )
    
    logger.info("成功连接到MySQL服务器！")
    
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS campus_daze CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        logger.info("数据库 campus_daze 创建成功！")
        
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        logger.info("现有数据库列表：")
        for db in databases:
            logger.info(f"  - {db[0]}")
    
    connection.close()
    logger.info("数据库连接已关闭")
    
except pymysql.Error as e:
    logger.error(f"连接失败: {e}")
    logger.error(f"错误代码: {e.args[0]}")
    logger.error(f"错误信息: {e.args[1]}")
except Exception as e:
    logger.error(f"其他错误: {e}")