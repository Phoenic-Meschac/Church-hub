from rest_framework import serializers

from .models import Caisse, CaisseAssignment, OfferingType, Transaction


class OfferingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferingType
        fields = ["id", "name", "code", "description", "is_active", "created_at"]


class CaisseAssignmentSerializer(serializers.ModelSerializer):
    caisse_name = serializers.CharField(source="caisse.name", read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    worker_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    assignee_name = serializers.CharField(read_only=True)

    class Meta:
        model = CaisseAssignment
        fields = [
            "id",
            "caisse",
            "caisse_name",
            "worker",
            "worker_name",
            "user",
            "user_name",
            "assignee_name",
            "role",
            "role_display",
            "is_active",
            "created_at",
        ]

    def get_worker_name(self, obj):
        return obj.worker.full_name if obj.worker else None

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None

    def validate(self, attrs):
        worker = attrs.get("worker", getattr(self.instance, "worker", None))
        user = attrs.get("user", getattr(self.instance, "user", None))
        if not worker and not user:
            raise serializers.ValidationError("Indiquez un ouvrier ou un utilisateur à assigner.")
        return attrs


class CaisseSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    transaction_count = serializers.SerializerMethodField()
    assignments = CaisseAssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = Caisse
        fields = [
            "id",
            "name",
            "code",
            "type",
            "type_display",
            "description",
            "currency",
            "opening_balance",
            "current_balance",
            "is_active",
            "transaction_count",
            "assignments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["current_balance"]

    def get_transaction_count(self, obj):
        return obj.transactions.count()


class TransactionSerializer(serializers.ModelSerializer):
    caisse_name = serializers.CharField(source="caisse.name", read_only=True)
    offering_type_name = serializers.CharField(source="offering_type.name", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    direction_display = serializers.CharField(source="get_direction_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    contributor_display = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "reference",
            "caisse",
            "caisse_name",
            "direction",
            "direction_display",
            "category",
            "category_display",
            "offering_type",
            "offering_type_name",
            "amount",
            "currency",
            "date",
            "label",
            "contributor_worker",
            "contributor_name",
            "contributor_display",
            "status",
            "status_display",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["reference", "recorded_by", "direction"]

    def get_contributor_display(self, obj):
        if obj.contributor_worker:
            return obj.contributor_worker.full_name
        return obj.contributor_name or "—"

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.email
        return None

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request.user, "is_authenticated", False):
            validated_data.setdefault("recorded_by", request.user)
        return super().create(validated_data)
