# core/serializers.py
from rest_framework import serializers


class QAItemSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=255)
    answer = serializers.CharField(allow_blank=True, required=False)


class MembershipApplicationSerializer(serializers.Serializer):
    parent_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=50)
    email = serializers.EmailField()

    child_name = serializers.CharField(max_length=120)
    child_age = serializers.CharField(max_length=20)

    art_relationship = serializers.CharField(required=False, allow_blank=True)
    expectation = serializers.ChoiceField(choices=["hobby", "performance"])
    source = serializers.CharField(required=False, allow_blank=True)

    # ✅ NEW (CMS-driven questions snapshot + dynamic answers fallback)
    qa_items = QAItemSerializer(many=True, required=False)
    dynamic_answers = serializers.DictField(child=serializers.CharField(), required=False)