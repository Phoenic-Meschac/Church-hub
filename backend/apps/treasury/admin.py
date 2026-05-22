from django.contrib import admin

from .models import Caisse, CaisseAssignment, OfferingType, Transaction


class CaisseAssignmentInline(admin.TabularInline):
    model = CaisseAssignment
    extra = 0


@admin.register(Caisse)
class CaisseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "type", "currency", "current_balance", "is_active")
    list_filter = ("type", "is_active", "currency")
    search_fields = ("name", "code")
    readonly_fields = ("current_balance",)
    inlines = [CaisseAssignmentInline]


@admin.register(OfferingType)
class OfferingTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active")
    search_fields = ("name", "code")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("reference", "date", "caisse", "category", "direction", "amount", "status")
    list_filter = ("category", "direction", "status", "caisse")
    search_fields = ("reference", "label", "contributor_name")
    readonly_fields = ("reference",)


@admin.register(CaisseAssignment)
class CaisseAssignmentAdmin(admin.ModelAdmin):
    list_display = ("assignee_name", "caisse", "role", "is_active")
    list_filter = ("role", "is_active")
