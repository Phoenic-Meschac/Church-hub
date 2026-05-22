from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.audit.services import log_event
from apps.core.permissions import ModulePermission
from apps.core.viewsets import AuditedModelViewSet

from .models import Permission, Role, User
from .serializers import (
    ChangePasswordSerializer,
    ChurchTokenObtainPairSerializer,
    MeSerializer,
    PermissionSerializer,
    ProfileUpdateSerializer,
    RoleSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = ChurchTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user = User.objects.filter(email=request.data.get("email")).first()
            if user:
                log_event(
                    "login",
                    f"Connexion de {user.get_full_name() or user.email}",
                    request=request,
                    actor=user,
                )
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        log_event("logout", f"Déconnexion de {request.user.email}", request=request)
        return Response({"detail": "Déconnexion enregistrée."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MeSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        log_event("custom", "Changement de mot de passe", request=request)
        return Response({"detail": "Mot de passe mis à jour."})


class UserViewSet(AuditedModelViewSet):
    queryset = User.objects.prefetch_related("roles").all()
    serializer_class = UserSerializer
    perm_view = "iam.view"
    perm_manage = "iam.manage"
    filterset_fields = ["is_active", "is_staff", "roles"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    ordering_fields = ["date_joined", "email", "first_name"]


class RoleViewSet(AuditedModelViewSet):
    queryset = Role.objects.prefetch_related("permissions", "users").all()
    serializer_class = RoleSerializer
    perm_view = "iam.view"
    perm_manage = "iam.manage"
    search_fields = ["name", "description"]

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        if instance.is_system:
            raise PermissionDenied("Ce rôle système ne peut pas être supprimé.")
        super().perform_destroy(instance)


class PermissionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [ModulePermission]
    perm_view = "iam.view"
    pagination_class = None
    filterset_fields = ["module"]
