from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Journal d'audit : trace toutes les actions sensibles de l'application."""

    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_LOGIN = "login"
    ACTION_LOGOUT = "logout"
    ACTION_CUSTOM = "custom"
    ACTIONS = [
        (ACTION_CREATE, "Création"),
        (ACTION_UPDATE, "Modification"),
        (ACTION_DELETE, "Suppression"),
        (ACTION_LOGIN, "Connexion"),
        (ACTION_LOGOUT, "Déconnexion"),
        (ACTION_CUSTOM, "Action"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
        verbose_name="Acteur",
    )
    actor_label = models.CharField("Acteur (libellé)", max_length=200, blank=True)
    action = models.CharField("Action", max_length=20, choices=ACTIONS)
    module = models.CharField("Module", max_length=40, blank=True)
    model_name = models.CharField("Modèle", max_length=120, blank=True)
    object_id = models.CharField("ID objet", max_length=64, blank=True)
    object_repr = models.CharField("Objet", max_length=255, blank=True)
    changes = models.JSONField("Changements", null=True, blank=True)
    ip_address = models.GenericIPAddressField("Adresse IP", null=True, blank=True)
    user_agent = models.CharField("Navigateur", max_length=255, blank=True)
    timestamp = models.DateTimeField("Horodatage", auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journaux d'audit"
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["model_name"]),
        ]

    def __str__(self):
        return f"{self.timestamp:%Y-%m-%d %H:%M} · {self.get_action_display()} · {self.object_repr}"
