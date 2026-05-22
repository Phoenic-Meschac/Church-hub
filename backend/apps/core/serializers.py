from rest_framework import serializers

from .models import ChurchProfile


class ChurchProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChurchProfile
        fields = [
            "id",
            "name",
            "slogan",
            "logo",
            "address",
            "phone",
            "email",
            "default_currency",
        ]
