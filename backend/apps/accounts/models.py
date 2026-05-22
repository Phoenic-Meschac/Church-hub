from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel

from .managers import UserManager


class Permission(models.Model):
    """Permission granulaire propre à ChurchHub (RBAC par module)."""

    code = models.CharField("Code", max_length=80, unique=True)
    module = models.CharField("Module", max_length=40)
    label = models.CharField("Libellé", max_length=160)

    class Meta:
        ordering = ["module", "code"]
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"

    def __str__(self):
        return self.code


class Role(TimeStampedModel):
    """Rôle regroupant un ensemble de permissions."""

    name = models.CharField("Nom", max_length=80, unique=True)
    description = models.TextField("Description", blank=True)
    is_system = models.BooleanField("Rôle système", default=False)
    permissions = models.ManyToManyField(
        Permission, related_name="roles", blank=True, verbose_name="Permissions"
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    """Utilisateur de l'application, identifié par son email."""

    email = models.EmailField("Email", unique=True)
    first_name = models.CharField("Prénom", max_length=120, blank=True)
    last_name = models.CharField("Nom", max_length=120, blank=True)
    phone = models.CharField("Téléphone", max_length=30, blank=True)
    photo = models.ImageField("Photo", upload_to="avatars/", blank=True, null=True)
    is_active = models.BooleanField("Actif", default=True)
    is_staff = models.BooleanField("Accès admin Django", default=False)
    date_joined = models.DateTimeField("Inscrit le", default=timezone.now)
    roles = models.ManyToManyField(
        Role, related_name="users", blank=True, verbose_name="Rôles"
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["first_name", "last_name"]
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return self.get_full_name() or self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name or self.email

    @property
    def permission_codes(self):
        if self.is_superuser:
            from .constants import ALL_PERMISSION_CODES

            return list(ALL_PERMISSION_CODES)
        return list(
            Permission.objects.filter(roles__users=self)
            .values_list("code", flat=True)
            .distinct()
        )

    def has_perm_code(self, code):
        if self.is_superuser:
            return True
        return self.roles.filter(permissions__code=code).exists()
