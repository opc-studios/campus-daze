"""异步邮件发送服务（aiosmtplib）+ 验证码生成/校验。"""
import secrets
import string
from datetime import datetime, timedelta

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.email_verification import EmailVerification
from app.utils.security import hash_password, verify_password


def _generate_code(length: int = 6) -> str:
    """生成数字验证码。"""
    return "".join(secrets.choice(string.digits) for _ in range(length))


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """通过 aiosmtplib 异步发送邮件。失败抛 ConnectionError。"""
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        raise RuntimeError("SMTP 未配置，无法发送邮件")

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        use_tls=settings.SMTP_USE_TLS,
    )


async def send_password_reset_code(db: AsyncSession, user_email: str, user_id: int) -> str:
    """生成并发送密码重置验证码。返回明文验证码（仅用于日志，不返回给客户端）。"""
    code = _generate_code(settings.SMTP_VERIFY_CODE_LENGTH)
    code_hash = hash_password(code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SMTP_VERIFY_CODE_TTL_MINUTES)

    # 旧码失效
    await db.execute(
        update(EmailVerification)
        .where(
            EmailVerification.user_id == user_id,
            EmailVerification.purpose == "password_reset",
            EmailVerification.consumed_at.is_(None),
        )
        .values(consumed_at=datetime.utcnow())
    )

    db.add(EmailVerification(
        user_id=user_id,
        code_hash=code_hash,
        purpose="password_reset",
        expires_at=expires_at,
    ))
    await db.commit()

    html = f"""
    <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1A3C6E;">同舟喵济 · 密码重置</h2>
      <p>您的密码重置验证码为：</p>
      <div style="font-size: 32px; font-weight: bold; color: #FF6B9D; letter-spacing: 8px; padding: 16px; background: #FFF0F5; border-radius: 8px; text-align: center;">{code}</div>
      <p style="color: #666; font-size: 12px;">验证码 {settings.SMTP_VERIFY_CODE_TTL_MINUTES} 分钟内有效，请勿告知他人。</p>
    </div>
    """
    await _send_email(user_email, "【同舟喵济】密码重置验证码", html)
    return code


async def verify_password_reset_code(db: AsyncSession, user_id: int, code: str) -> bool:
    """校验验证码。成功则标记 consumed_at 并返回 True。"""
    result = await db.execute(
        select(EmailVerification).where(
            EmailVerification.user_id == user_id,
            EmailVerification.purpose == "password_reset",
            EmailVerification.consumed_at.is_(None),
            EmailVerification.expires_at > datetime.utcnow(),
        ).order_by(EmailVerification.created_at.desc()).limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False
    if not verify_password(code, record.code_hash):
        return False
    record.consumed_at = datetime.utcnow()
    await db.commit()
    return True
