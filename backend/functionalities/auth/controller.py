import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .models import UserLogin, Token, RefreshTokenRequest, UserRegister, PasswordChangeRequest
from .service import AuthService, get_auth_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    """
    Login user with email and password.
    
    Returns access token and refresh token.
    """
    logger.info(f"Login attempt for email: {user_credentials.email}")
    try:
        user = UserLogin(
            email=user_credentials.email,
            password=user_credentials.password
        )

        logger.debug(f"UserLogin object created: {user}")
        result = await auth_service.login(user)
        logger.info(f"Login successful for email: {user_credentials.email}")
        return Token(**result)

    except HTTPException as e:
        logger.error(f"HTTP error during login for {user_credentials.email}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login for {user_credentials.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, auth_service: AuthService = Depends(get_auth_service)):
    """
    Register a new user.
    
    Returns access token and refresh token.
    """
    logger.info(f"Registration attempt for email: {user_data.email}, name: {user_data.name}")
    logger.debug(f"UserRegister data received: {user_data}")

    try:
        result = await auth_service.register(user_data)
        logger.info(f"Registration successful for email: {user_data.email}")
        return Token(**result)

    except HTTPException as e:
        logger.error(f"HTTP error during registration for {user_data.email}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration for {user_data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_request: RefreshTokenRequest, auth_service: AuthService = Depends(get_auth_service)):
    """
    Refresh access token using refresh token.
    
    Returns new access token and refresh token.
    """
    logger.info("Token refresh attempt")
    try:
        result = await auth_service.refresh_token(refresh_request)
        logger.info("Token refresh successful")
        return Token(**result)

    except HTTPException as e:
        logger.error(f"HTTP error during token refresh: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security),
                           auth_service: AuthService = Depends(get_auth_service)):
    """
    Get current user information.
    """
    logger.info("Get current user attempt")
    try:
        token = credentials.credentials
        result = await auth_service.get_user(token)
        logger.info("Get current user successful")
        return result

    except HTTPException as e:
        logger.error(f"HTTP error during get current user: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during get current user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.patch("/change-password")
async def change_password(
    password_request: PasswordChangeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Change user password.
    """
    logger.info("Password change attempt")
    try:
        token = credentials.credentials
        result = await auth_service.change_password(token, password_request)
        logger.info("Password change successful")
        return result

    except HTTPException as e:
        logger.error(f"HTTP error during password change: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during password change: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

