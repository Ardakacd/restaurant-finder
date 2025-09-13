import logging
import uuid

from .adapter import AuthAdapter
from database.config import get_async_db
from fastapi import Depends, HTTPException, status
from .models import User, RefreshTokenRequest, UserRegister, UserLogin, UserUpdate, UserCreate, PasswordChangeRequest
from sqlalchemy.ext.asyncio import AsyncSession
from utils.jwt import create_access_token, create_refresh_token, verify_token, verify_refresh_token, get_user_id_from_token
from utils.password import verify_password, get_password_hash

# Configure logging
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, auth_adapter: AuthAdapter):
        self.auth_adapter = auth_adapter

    async def login(self, user: UserLogin):
        logger.info(f"AuthService: Login attempt for email: {user.email}")
        try:
            db_user = await self.auth_adapter.get_user_by_email(user.email)
            if not db_user:
                logger.warning(f"AuthService: Login failed - user not found for email: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="E-posta veya şifre yanlış"
                )

            if not verify_password(user.password, db_user.password):
                logger.warning(f"AuthService: Login failed - incorrect password for email: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="E-posta veya şifre yanlış"
                )

            access_token = create_access_token(
                data={"user_id": db_user.id}
            )

            refresh_token = create_refresh_token(
                data={"user_id": db_user.id}
            )

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_name": db_user.name,

            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"AuthService: Unexpected error during login for {user.email}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def register(self, user: UserRegister):
        logger.info(f"AuthService: Registration attempt for email: {user.email}, name: {user.name}")
        try:
            hashed_password = get_password_hash(user.password)
            logger.debug(f"AuthService: Password hashed successfully for email: {user.email}")

            user_id = str(uuid.uuid4())
            logger.debug(f"AuthService: Generated user ID: {user_id}")

            user_data = UserCreate(
                user_id=user_id,
                name=user.name,
                email=user.email,
                password=hashed_password
            )

            logger.debug(f"AuthService: User object created: {user_data}")
            db_user = await self.auth_adapter.create_user(user_data)

            if not db_user:
                logger.error(f"AuthService: Failed to create user in database: {user.email}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Kullanıcı oluşturulamadı"
                )

            logger.info(f"AuthService: User created successfully in database: {db_user.id}")

            access_token = create_access_token(
                data={"user_id": db_user.id}
            )

            refresh_token = create_refresh_token(
                data={"user_id": db_user.id}
            )

            logger.info(f"AuthService: Registration successful for user: {db_user.id}")

            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user_name": user.name,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"AuthService: Unexpected error during registration for {user.email}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def refresh_token(self, refresh_request: RefreshTokenRequest):
        try:
            token_data = verify_refresh_token(refresh_request.refresh_token)
            user_id = token_data.user_id

            user = await self.auth_adapter.get_user_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kullanıcı bulunamadı"
                )

            access_token = create_access_token(
                data={"user_id": user_id}
            )

            new_refresh_token = create_refresh_token(
                data={"user_id": user_id}
            )

            return {
                "access_token": access_token,
                "refresh_token": new_refresh_token,
                "user_name": user.name,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def get_user(self, token: str):
        try:
            user_id = get_user_id_from_token(token)

            user = await self.auth_adapter.get_user_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Kullanıcı bulunamadı"
                )

            return {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def update_user(self, token: str, user: User):
        try:
            user_id = get_user_id_from_token(token)

            existing_user = await self.auth_adapter.get_user_by_id(user_id)
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Kullanıcı bulunamadı"
                )

            hashed_password = get_password_hash(user.password) if user.password else existing_user.password

            user_data = UserUpdate(
                name=user.name if user.name else existing_user.name,
                email=user.email if user.email else existing_user.email,
                password=hashed_password
            )

            await self.auth_adapter.update_user(existing_user.id, user_data)

            return {"message": "Kullanıcı güncellendi"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def change_password(self, token: str, password_request: PasswordChangeRequest):
        try:
            user_id = get_user_id_from_token(token)

            existing_user = await self.auth_adapter.get_user_by_id(user_id)
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Kullanıcı bulunamadı"
                )

            if not verify_password(password_request.current_password, existing_user.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Mevcut şifre yanlış"
                )

            hashed_new_password = get_password_hash(password_request.new_password)

            user_data = UserUpdate(password=hashed_new_password)
            await self.auth_adapter.update_user(existing_user.id, user_data)

            return {"message": "Şifre başarıyla değiştirildi"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )

    async def delete_user(self, token: str):
        try:
            user_id = get_user_id_from_token(token)

            await self.auth_adapter.delete_user(user_id)

            return {"message": "Kullanıcı silindi"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Sunucu hatası"
            )


def get_auth_service(
        db: AsyncSession = Depends(get_async_db),
) -> AuthService:
    auth_adapter = AuthAdapter(db)
    return AuthService(auth_adapter)
