from rest_framework.permissions import SAFE_METHODS, BasePermission


class ModulePermission(BasePermission):
    """Permission basée sur des codes par module (RBAC ChurchHub).

    Les vues définissent ``perm_view`` (lecture) et ``perm_manage`` (écriture).
    Les super-utilisateurs passent toujours. Si aucun code n'est défini, seul
    l'authentification est requise.
    """

    message = "Vous n'avez pas la permission requise pour cette action."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if request.method in SAFE_METHODS:
            code = getattr(view, "perm_view", None)
        else:
            code = getattr(view, "perm_manage", None)
        if not code:
            return True
        return user.has_perm_code(code)
