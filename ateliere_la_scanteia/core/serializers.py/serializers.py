from rest_framework import serializers

class MembershipApplicationSerializer(serializers.Serializer):
    parent_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=50)
    email = serializers.EmailField()

    child_name = serializers.CharField(max_length=120)
    child_age = serializers.CharField(max_length=20)

    art_relationship = serializers.CharField()
    expectation = serializers.ChoiceField(choices=["hobby", "performance"])

    source = serializers.CharField(required=False, allow_blank=True)