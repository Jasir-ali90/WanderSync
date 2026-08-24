"""JWT authentication bridge for MongoDB-backed users.

SimpleJWT's stock authentication class looks users up through Django's ORM;
this subclass resolves the ``user_id`` claim against the MongoEngine User
document instead. Token creation/verification logic is unchanged.
"""
import logging

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken
from rest_framework_simplejwt.settings import api_settings
from django.utils.translation import gettext_lazy as _

from apps.accounts.documents import User

logger = logging.getLogger(__name__)


class MongoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))

        user = User.objects(public_id=str(user_id)).first()
        if user is None:
            raise AuthenticationFailed(_("User not found"), code="user_not_found")
        if not user.is_active:
            raise AuthenticationFailed(_("User is inactive"), code="user_inactive")
        return user
