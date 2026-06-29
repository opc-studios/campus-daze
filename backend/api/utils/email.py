import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.qq.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', '')

async def send_email(to_email: str, subject: str, html_content: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        logger.error(f"邮件发送失败: {e}")
        return False

async def send_welcome_email(to_email: str, username: str, password: str):
    subject = '欢迎来到学术喵的奇幻之旅！'
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>欢迎注册</title>
    </head>
    <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6B46C1;">🎓 欢迎来到学术喵的奇幻之旅！</h2>
            <p>亲爱的 <strong>{username}</strong>，</p>
            <p>恭喜你成功注册了学术喵的奇幻之旅账号！</p>
            <p>以下是你的账号信息：</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>用户名：</strong>{username}</p>
                <p><strong>密码：</strong>{password}</p>
            </div>
            <p>准备好开始你的校园冒险了吗？创建你的角色，探索神秘的校园世界！</p>
            <p style="margin-top: 30px;">祝你游戏愉快！</p>
            <p style="color: #666; font-size: 12px;">学术喵的奇幻之旅团队</p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)

async def send_new_password_email(to_email: str, username: str, new_password: str):
    subject = '学术喵的奇幻之旅 - 密码重置成功'
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>密码重置成功</title>
    </head>
    <body>
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6B46C1;">🔑 密码重置成功</h2>
            <p>亲爱的 <strong>{username}</strong>，</p>
            <p>你的密码已成功重置！</p>
            <p>以下是你的新密码：</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>用户名：</strong>{username}</p>
                <p><strong>新密码：</strong>{new_password}</p>
            </div>
            <p>请使用新密码登录游戏。</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">学术喵的奇幻之旅团队</p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)