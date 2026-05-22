from django.contrib import admin

from .models import ChurchProfile


@admin.register(ChurchProfile)
class ChurchProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "default_currency", "phone", "email")
