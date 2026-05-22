from rest_framework import serializers

from .models import Attendance, Event, Task, Worker


class WorkerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    function_name = serializers.CharField(source="function.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Worker
        fields = [
            "id",
            "matricule",
            "user",
            "first_name",
            "last_name",
            "full_name",
            "gender",
            "phone",
            "email",
            "photo",
            "address",
            "birth_date",
            "join_date",
            "status",
            "status_display",
            "department",
            "department_name",
            "function",
            "function_name",
            "created_at",
        ]
        read_only_fields = ["matricule", "created_at"]


class EventSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    attendance_count = serializers.SerializerMethodField()
    present_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "name",
            "type",
            "type_display",
            "date",
            "start_time",
            "location",
            "description",
            "department",
            "department_name",
            "attendance_count",
            "present_count",
            "created_at",
        ]

    def get_attendance_count(self, obj):
        return obj.attendances.count()

    def get_present_count(self, obj):
        return obj.attendances.filter(status__in=["present", "late"]).count()


class AttendanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    event_name = serializers.CharField(source="event.name", read_only=True)
    event_date = serializers.DateField(source="event.date", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "event",
            "event_name",
            "event_date",
            "worker",
            "worker_name",
            "status",
            "status_display",
            "check_in_time",
            "note",
        ]


class TaskSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "worker",
            "worker_name",
            "department",
            "department_name",
            "title",
            "description",
            "priority",
            "priority_display",
            "status",
            "status_display",
            "due_date",
            "created_at",
            "updated_at",
        ]
