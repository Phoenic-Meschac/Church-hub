import datetime
import uuid
from decimal import Decimal

from .middleware import get_current_request
from .models import AuditLog

SKIP_FIELDS = {"password", "last_login"}


def _to_jsonable(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    return str(value)


def serialize_instance(instance):
    data = {}
    for field in instance._meta.concrete_fields:
        if field.name in SKIP_FIELDS:
            continue
        try:
            data[field.name] = _to_jsonable(getattr(instance, field.attname))
        except Exception:
            continue
    return data


def _client_ip(request):
    if not request:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _actor_label(actor):
    if not actor:
        return "Système"
    full = actor.get_full_name() if hasattr(actor, "get_full_name") else ""
    return full or getattr(actor, "email", "") or str(actor)


def _resolve_actor(request, actor):
    if actor is None and request is not None:
        actor = getattr(request, "user", None)
    if actor is not None and not getattr(actor, "is_authenticated", False):
        actor = None
    return actor


def log_model_action(action, instance, request=None, old_data=None):
    """Enregistre une action create/update/delete sur un modèle."""
    request = request or get_current_request()
    new_data = None if action == "delete" else serialize_instance(instance)

    if action == "update" and old_data is not None:
        changes = {
            key: {"old": old_data.get(key), "new": new_data.get(key)}
            for key in new_data
            if old_data.get(key) != new_data.get(key)
        }
    elif action == "create":
        changes = new_data
    else:
        changes = None

    actor = _resolve_actor(request, None)
    AuditLog.objects.create(
        actor=actor,
        actor_label=_actor_label(actor),
        action=action,
        module=instance._meta.app_label,
        model_name=instance._meta.label,
        object_id=str(getattr(instance, "pk", "") or ""),
        object_repr=str(instance)[:255],
        changes=changes,
        ip_address=_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:255] if request else ""),
    )


def log_event(action, label, request=None, actor=None, changes=None, module="accounts"):
    """Enregistre un évènement libre (connexion, déconnexion, action métier)."""
    request = request or get_current_request()
    actor = _resolve_actor(request, actor)
    AuditLog.objects.create(
        actor=actor,
        actor_label=_actor_label(actor),
        action=action,
        module=module,
        model_name="",
        object_id="",
        object_repr=label[:255],
        changes=changes,
        ip_address=_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:255] if request else ""),
    )
