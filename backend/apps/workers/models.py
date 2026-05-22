from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Worker(TimeStampedModel):
    """Ouvrier de l'église, rattaché à un département et une fonction."""

    GENDER_CHOICES = [("M", "Masculin"), ("F", "Féminin")]
    STATUS_CHOICES = [
        ("active", "Actif"),
        ("inactive", "Inactif"),
        ("suspended", "Suspendu"),
    ]

    matricule = models.CharField("Matricule", max_length=20, unique=True, blank=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="worker_profile",
        verbose_name="Compte utilisateur",
    )
    first_name = models.CharField("Prénom", max_length=120)
    last_name = models.CharField("Nom", max_length=120)
    gender = models.CharField("Genre", max_length=1, choices=GENDER_CHOICES, blank=True)
    phone = models.CharField("Téléphone", max_length=30, blank=True)
    email = models.EmailField("Email", blank=True)
    photo = models.ImageField("Photo", upload_to="workers/", blank=True, null=True)
    address = models.CharField("Adresse", max_length=255, blank=True)
    birth_date = models.DateField("Date de naissance", null=True, blank=True)
    join_date = models.DateField("Date d'adhésion", null=True, blank=True)
    status = models.CharField("Statut", max_length=12, choices=STATUS_CHOICES, default="active")
    department = models.ForeignKey(
        "departments.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="workers",
        verbose_name="Département",
    )
    function = models.ForeignKey(
        "departments.Function",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="workers",
        verbose_name="Fonction",
    )

    class Meta:
        ordering = ["first_name", "last_name"]
        verbose_name = "Ouvrier"
        verbose_name_plural = "Ouvriers"

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def save(self, *args, **kwargs):
        creating = self._state.adding and not self.matricule
        super().save(*args, **kwargs)
        if creating and not self.matricule:
            self.matricule = f"OUV-{self.pk:04d}"
            super().save(update_fields=["matricule"])


class Event(TimeStampedModel):
    """Culte, réunion ou évènement support de la prise de présence."""

    TYPE_CHOICES = [
        ("culte", "Culte"),
        ("reunion", "Réunion"),
        ("repetition", "Répétition"),
        ("evenement", "Évènement"),
        ("autre", "Autre"),
    ]

    name = models.CharField("Intitulé", max_length=160)
    type = models.CharField("Type", max_length=12, choices=TYPE_CHOICES, default="culte")
    date = models.DateField("Date")
    start_time = models.TimeField("Heure", null=True, blank=True)
    location = models.CharField("Lieu", max_length=160, blank=True)
    description = models.TextField("Description", blank=True)
    department = models.ForeignKey(
        "departments.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="events",
        verbose_name="Département concerné",
    )

    class Meta:
        ordering = ["-date", "-start_time"]
        verbose_name = "Évènement"
        verbose_name_plural = "Évènements"

    def __str__(self):
        return f"{self.name} — {self.date:%d/%m/%Y}"


class Attendance(TimeStampedModel):
    """Présence d'un ouvrier à un évènement."""

    STATUS_CHOICES = [
        ("present", "Présent"),
        ("absent", "Absent"),
        ("late", "En retard"),
        ("excused", "Excusé"),
    ]

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="attendances", verbose_name="Évènement"
    )
    worker = models.ForeignKey(
        Worker, on_delete=models.CASCADE, related_name="attendances", verbose_name="Ouvrier"
    )
    status = models.CharField("Statut", max_length=10, choices=STATUS_CHOICES, default="present")
    check_in_time = models.TimeField("Heure d'arrivée", null=True, blank=True)
    note = models.CharField("Note", max_length=255, blank=True)

    class Meta:
        ordering = ["-event__date"]
        unique_together = ["event", "worker"]
        verbose_name = "Présence"
        verbose_name_plural = "Présences"

    def __str__(self):
        return f"{self.worker} · {self.get_status_display()}"


class Task(TimeStampedModel):
    """Tâche spécifique assignée à un ouvrier."""

    PRIORITY_CHOICES = [("low", "Basse"), ("medium", "Moyenne"), ("high", "Haute")]
    STATUS_CHOICES = [
        ("todo", "À faire"),
        ("in_progress", "En cours"),
        ("done", "Terminée"),
    ]

    worker = models.ForeignKey(
        Worker,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tasks",
        verbose_name="Assigné à",
    )
    department = models.ForeignKey(
        "departments.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tasks",
        verbose_name="Département",
    )
    title = models.CharField("Titre", max_length=200)
    description = models.TextField("Description", blank=True)
    priority = models.CharField("Priorité", max_length=8, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField("Statut", max_length=12, choices=STATUS_CHOICES, default="todo")
    due_date = models.DateField("Échéance", null=True, blank=True)

    class Meta:
        ordering = ["status", "-priority", "due_date"]
        verbose_name = "Tâche"
        verbose_name_plural = "Tâches"

    def __str__(self):
        return self.title
