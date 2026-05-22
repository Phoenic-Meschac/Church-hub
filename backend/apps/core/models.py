from django.db import models


class TimeStampedModel(models.Model):
    """Modèle de base : horodatage de création et de mise à jour."""

    created_at = models.DateTimeField("Créé le", auto_now_add=True)
    updated_at = models.DateTimeField("Mis à jour le", auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class ChurchProfile(TimeStampedModel):
    """Profil unique de l'église (nom, logo, coordonnées) affiché dans l'app."""

    name = models.CharField("Nom de l'église", max_length=200, default="Mon Église")
    slogan = models.CharField("Slogan", max_length=255, blank=True)
    logo = models.ImageField("Logo", upload_to="church/", blank=True, null=True)
    address = models.CharField("Adresse", max_length=255, blank=True)
    phone = models.CharField("Téléphone", max_length=40, blank=True)
    email = models.EmailField("Email", blank=True)
    default_currency = models.CharField("Devise par défaut", max_length=8, default="CDF")

    class Meta:
        verbose_name = "Profil de l'église"
        verbose_name_plural = "Profil de l'église"

    def __str__(self):
        return self.name

    @classmethod
    def get_solo(cls):
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj
