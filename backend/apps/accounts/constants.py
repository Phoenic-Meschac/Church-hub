"""Registre central des modules, permissions et rôles par défaut (IAM)."""

# Modules fonctionnels de l'application : (code, libellé)
MODULES = [
    ("dashboard", "Tableau de bord"),
    ("iam", "Utilisateurs & accès"),
    ("departments", "Départements"),
    ("workers", "Ouvriers"),
    ("treasury", "Trésorerie"),
    ("audit", "Audit"),
]

# Permissions granulaires : (code, module, libellé)
PERMISSIONS = [
    ("dashboard.view", "dashboard", "Voir le tableau de bord"),

    ("iam.view", "iam", "Voir les utilisateurs et rôles"),
    ("iam.manage", "iam", "Gérer les utilisateurs, rôles et permissions"),

    ("departments.view", "departments", "Voir les départements"),
    ("departments.manage", "departments", "Gérer les départements et fonctions"),

    ("workers.view", "workers", "Voir les ouvriers"),
    ("workers.manage", "workers", "Gérer les ouvriers et leurs tâches"),
    ("workers.attendance", "workers", "Gérer les présences"),

    ("treasury.view", "treasury", "Voir la trésorerie"),
    ("treasury.manage", "treasury", "Saisir dîmes, offrandes et transactions"),
    ("treasury.caisse_manage", "treasury", "Créer et assigner des caisses"),
    ("treasury.expense_approve", "treasury", "Approuver les dépenses"),

    ("audit.view", "audit", "Consulter le journal d'audit"),
]

ALL_PERMISSION_CODES = [code for code, _module, _label in PERMISSIONS]

# Rôles prédéfinis : nom -> (description, "ALL" | liste de codes)
DEFAULT_ROLES = {
    "Administrateur": (
        "Accès complet à toute l'application",
        "ALL",
    ),
    "Pasteur principal": (
        "Supervision globale (lecture étendue + gestion)",
        [
            "dashboard.view",
            "iam.view",
            "departments.view",
            "departments.manage",
            "workers.view",
            "workers.manage",
            "workers.attendance",
            "treasury.view",
            "treasury.expense_approve",
            "audit.view",
        ],
    ),
    "Trésorier": (
        "Gestion complète de la trésorerie",
        [
            "dashboard.view",
            "treasury.view",
            "treasury.manage",
            "treasury.caisse_manage",
            "treasury.expense_approve",
            "workers.view",
        ],
    ),
    "Chef de département": (
        "Gestion de son département et de ses ouvriers",
        [
            "dashboard.view",
            "departments.view",
            "workers.view",
            "workers.manage",
            "workers.attendance",
        ],
    ),
    "Secrétaire": (
        "Saisie et consultation courante",
        [
            "dashboard.view",
            "departments.view",
            "workers.view",
            "workers.attendance",
            "treasury.view",
        ],
    ),
    "Ouvrier": (
        "Accès de base au tableau de bord",
        [
            "dashboard.view",
            "workers.view",
        ],
    ),
}
