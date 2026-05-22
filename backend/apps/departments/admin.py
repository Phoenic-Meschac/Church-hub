from django.contrib import admin

from .models import Department, Function


class FunctionInline(admin.TabularInline):
    model = Function
    extra = 0


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "leader", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "code")
    inlines = [FunctionInline]


@admin.register(Function)
class FunctionAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "is_active")
    list_filter = ("department", "is_active")
    search_fields = ("name",)
