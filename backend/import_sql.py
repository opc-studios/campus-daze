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
DB_NAME = os.getenv('DB_NAME', 'campus_daze')

try:
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        database=DB_NAME,
        charset='utf8mb4'
    )

    logger.info("成功连接到 campus_daze 数据库！")

    with open('init.sql', 'r', encoding='utf-8') as sql_file:
        sql_content = sql_file.read()

    sql_commands = sql_content.split(';')

    with connection.cursor() as cursor:
        for command in sql_commands:
            command = command.strip()
            if command and not command.startswith('CREATE DATABASE'):
                try:
                    cursor.execute(command)
                    logger.info(f"执行成功: {command[:50]}...")
                except pymysql.Error as e:
                    if e.args[0] != 1050:
                        logger.error(f"执行失败: {command[:50]}... 错误: {e}")

    connection.commit()
    logger.info("所有SQL语句执行完成！")

    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        logger.info("\n数据库中的表：")
        for table in tables:
            logger.info(f"  - {table[0]}")

    connection.close()
    logger.info("\n数据库连接已关闭")

except pymysql.Error as e:
    logger.error(f"连接失败: {e}")
    logger.error(f"错误代码: {e.args[0]}")
    logger.error(f"错误信息: {e.args[1]}")
except Exception as e:
    logger.error(f"其他错误: {e}")
