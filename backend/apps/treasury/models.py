from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q, Sum
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.models import TimeStampedModel


def default_currency():
    return getattr(settings, "DEFAULT_CURRENCY", "CDF")


class Caisse(TimeStampedModel):
    """Caisse / fonds de l'église (caisse principale, projet, mission...)."""

    TYPE_CHOICES = [
        ("principale", "Caisse principale"),
        ("secondaire", "Caisse secondaire"),
        ("projet", "Projet"),
        ("mission", "Mission"),
        ("departement", "Département"),
    ]

    name = models.CharField("Nom", max_length=120)
    code = models.CharField("Code", max_length=20, unique=True)
    type = models.CharField("Type", max_length=12, choices=TYPE_CHOICES, default="principale")
    description = models.TextField("Description", blank=True)
    currency = models.CharField("Devise", max_length=8, default=default_currency)
    opening_balance = models.DecimalField(
        "Solde d'ouverture", max_digits=14, decimal_places=2, default=Decimal("0")
    )
    current_balance = models.DecimalField(
        "Solde actuel", max_digits=14, decimal_places=2, default=Decimal("0")
    )
    is_active = models.BooleanField("Active", default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Caisse"
        verbose_name_plural = "Caisses"

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if self._state.adding:
            self.current_balance = self.opening_balance
        super().save(*args, **kwargs)

    def recompute_balance(self):
        agg = self.transactions.filter(status="validated").aggregate(
            ins=Sum("amount", filter=Q(direction="in")),
            outs=Sum("amount", filter=Q(direction="out")),
        )
        ins = agg["ins"] or Decimal("0")
        outs = agg["outs"] or Decimal("0")
        self.current_balance = self.opening_balance + ins - outs
        super().save(update_fields=["current_balance", "updated_at"])


class CaisseAssignment(TimeStampedModel):
    """Assignation d'un ouvrier à une caisse (caissier, responsable, auditeur)."""

    ROLE_CHOICES = [
        ("caissier", "Caissier"),
        ("responsable", "Responsable"),
        ("auditeur", "Auditeur"),
    ]

    caisse = models.ForeignKey(
        Caisse, on_delete=models.CASCADE, related_name="assignments", verbose_name="Caisse"
    )
    worker = models.ForeignKey(
        "workers.Worker",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="caisse_assignments",
        verbose_name="Ouvrier",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="caisse_assignments",
        verbose_name="Utilisateur",
    )
    role = models.CharField("Rôle", max_length=12, choices=ROLE_CHOICES, default="caissier")
    is_active = models.BooleanField("Active", default=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Assignation de caisse"
        verbose_name_plural = "Assignations de caisse"

    @property
    def assignee_name(self):
        if self.user:
            return self.user.get_full_name() or self.user.email
        if self.worker:
            return self.worker.full_name
        return "—"

    def __str__(self):
        return f"{self.assignee_name} → {self.caisse} ({self.get_role_display()})"


class OfferingType(TimeStampedModel):
    """Type d'offrande (offrande de culte, action de grâce, construction...)."""

    name = models.CharField("Nom", max_length=120, unique=True)
    code = models.CharField("Code", max_length=20, unique=True)
    description = models.TextField("Description", blank=True)
    is_active = models.BooleanField("Actif", default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Type d'offrande"
        verbose_name_plural = "Types d'offrande"

    def __str__(self):
        return self.name


class Transaction(TimeStampedModel):
    """Registre unifié : dîmes, offrandes, dons, dépenses, entrées/sorties."""

    DIRECTION_CHOICES = [("in", "Entrée"), ("out", "Sortie")]
    CATEGORY_CHOICES = [
        ("tithe", "Dîme"),
        ("offering", "Offrande"),
        ("donation", "Don"),
        ("expense", "Dépense"),
        ("transfer", "Transfert"),
        ("other", "Autre"),
    ]
    STATUS_CHOICES = [
        ("validated", "Validée"),
        ("pending", "En attente"),
        ("cancelled", "Annulée"),
    ]
    IN_CATEGORIES = {"tithe", "offering", "donation"}

    reference = models.CharField("Référence", max_length=20, unique=True, blank=True)
    caisse = models.ForeignKey(
        Caisse, on_delete=models.CASCADE, related_name="transactions", verbose_name="Caisse"
    )
    direction = models.CharField("Sens", max_length=3, choices=DIRECTION_CHOICES, default="in")
    category = models.CharField("Catégorie", max_length=12, choices=CATEGORY_CHOICES, default="offering")
    offering_type = models.ForeignKey(
        OfferingType,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="transactions",
        verbose_name="Type d'offrande",
    )
    amount = models.DecimalField("Montant", max_digits=14, decimal_places=2)
    currency = models.CharField("Devise", max_length=8, blank=True)
    date = models.DateField("Date")
    label = models.CharField("Libellé", max_length=255, blank=True)
    contributor_worker = models.ForeignKey(
        "workers.Worker",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="contributions",
        verbose_name="Contributeur (ouvrier)",
    )
    contributor_name = models.CharField("Contributeur (nom libre)", max_length=160, blank=True)
    status = models.CharField("Statut", max_length=10, choices=STATUS_CHOICES, default="validated")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recorded_transactions",
        verbose_name="Enregistré par",
    )

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        indexes = [
            models.Index(fields=["category", "direction"]),
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.reference or 'TRX'} · {self.get_category_display()} · {self.amount}"

    def save(self, *args, **kwargs):
        if self.category in self.IN_CATEGORIES:
            self.direction = "in"
        elif self.category == "expense":
            self.direction = "out"
        if self.caisse_id and not self.currency:
            self.currency = self.caisse.currency
        creating = self._state.adding and not self.reference
        super().save(*args, **kwargs)
        if creating and not self.reference:
            self.reference = f"TRX-{self.pk:06d}"
            super().save(update_fields=["reference"])


@receiver(post_save, sender=Transaction)
@receiver(post_delete, sender=Transaction)
def _refresh_caisse_balance(sender, instance, **kwargs):
    caisse = getattr(instance, "caisse", None)
    if caisse is not None:
        caisse.recompute_balance()
