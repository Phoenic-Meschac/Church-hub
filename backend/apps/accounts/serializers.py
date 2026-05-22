from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Permission, Role, User


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "module", "label"]


class RoleSerializer(serializers.ModelSerializer):
    permissions_detail = PermissionSerializer(
        source="permissions", many=True, read_only=True
    )
    user_count = serializers.IntegerField(source="users.count", read_only=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "description",
            "is_system",
            "permissions",
            "permissions_detail",
            "user_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["is_system", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, style={"input_type": "password"}
    )
    full_name = serializers.SerializerMethodField()
    role_names = serializers.SerializerMethodField()
    permission_codes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "photo",
            "password",
            "is_active",
            "is_staff",
            "is_superuser",
            "roles",
            "role_names",
            "permission_codes",
            "date_joined",
        ]
        read_only_fields = ["date_joined"]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_role_names(self, obj):
        return list(obj.roles.values_list("name", flat=True))

    def get_permission_codes(self, obj):
        return obj.permission_codes

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", [])
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance


class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "photo",
            "is_active",
            "is_staff",
            "is_superuser",
            "roles",
            "permissions",
            "date_joined",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_roles(self, obj):
        return list(obj.roles.values_list("name", flat=True))

    def get_permissions(self, obj):
        return obj.permission_codes


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "photo"]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value


class ChurchTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Renvoie le profil complet de l'utilisateur en plus des jetons."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = MeSerializer(self.user).data
        return data
