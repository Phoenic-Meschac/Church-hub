from django.db import models

from apps.core.models import TimeStampedModel


class Department(TimeStampedModel):
    """Département / ministère de l'église (chorale, protocole, intercession...)."""

    name = models.CharField("Nom", max_length=120, unique=True)
    code = models.CharField("Code", max_length=20, unique=True)
    description = models.TextField("Description", blank=True)
    color = models.CharField("Couleur", max_length=9, default="#6366f1")
    leader = models.ForeignKey(
        "workers.Worker",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="led_departments",
        verbose_name="Responsable",
    )
    meeting_day = models.CharField("Jour de réunion", max_length=20, blank=True)
    is_active = models.BooleanField("Actif", default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Département"
        verbose_name_plural = "Départements"

    def __str__(self):
        return self.name


class Function(TimeStampedModel):
    """Fonction / poste occupé par un ouvrier au sein d'un département."""

    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="functions", verbose_name="Département"
    )
    name = models.CharField("Nom", max_length=120)
    description = models.TextField("Description", blank=True)
    is_active = models.BooleanField("Actif", default=True)

    class Meta:
        ordering = ["department__name", "name"]
        unique_together = ["department", "name"]
        verbose_name = "Fonction"
        verbose_name_plural = "Fonctions"

    def __str__(self):
        return f"{self.name} ({self.department.code})"
