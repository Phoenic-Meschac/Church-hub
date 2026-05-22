from rest_framework import serializers

from .models import Department, Function


class FunctionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    worker_count = serializers.SerializerMethodField()

    class Meta:
        model = Function
        fields = [
            "id",
            "department",
            "department_name",
            "name",
            "description",
            "is_active",
            "worker_count",
            "created_at",
        ]

    def get_worker_count(self, obj):
        return obj.workers.count()


class DepartmentSerializer(serializers.ModelSerializer):
    leader_name = serializers.SerializerMethodField()
    worker_count = serializers.SerializerMethodField()
    function_count = serializers.SerializerMethodField()
    functions = FunctionSerializer(many=True, read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "description",
            "color",
            "leader",
            "leader_name",
            "meeting_day",
            "is_active",
            "worker_count",
            "function_count",
            "functions",
            "created_at",
            "updated_at",
        ]

    def get_leader_name(self, obj):
        return obj.leader.full_name if obj.leader else None

    def get_worker_count(self, obj):
        return obj.workers.count()

    def get_function_count(self, obj):
        return obj.functions.count()
