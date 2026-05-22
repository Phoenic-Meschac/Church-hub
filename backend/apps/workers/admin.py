from django.contrib import admin

from .models import Attendance, Event, Task, Worker


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ("matricule", "first_name", "last_name", "department", "function", "status")
    list_filter = ("status", "department", "gender")
    search_fields = ("first_name", "last_name", "matricule", "phone")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "date", "location")
    list_filter = ("type", "date")
    search_fields = ("name",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("worker", "event", "status", "check_in_time")
    list_filter = ("status", "event")
    search_fields = ("worker__first_name", "worker__last_name")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "worker", "department", "priority", "status", "due_date")
    list_filter = ("status", "priority", "department")
    search_fields = ("title",)
