import requests
import json
import logging

logger = logging.getLogger(__name__)

try:
    response = requests.get('http://localhost:8000/')
    logger.info(f"状态码: {response.status_code}")
    logger.info(f"响应内容: {response.text}")
    
    response = requests.get('http://localhost:8000/api/auth/me')
    logger.info(f"\n测试认证API:")
    logger.info(f"状态码: {response.status_code}")
    logger.info(f"响应内容: {response.text}")
    
except Exception as e:
    logger.error(f"错误: {e}")