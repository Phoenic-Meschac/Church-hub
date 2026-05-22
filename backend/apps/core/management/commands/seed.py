import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction as db_transaction
from django.utils import timezone

from apps.accounts.constants import DEFAULT_ROLES, PERMISSIONS
from apps.accounts.models import Permission, Role
from apps.core.models import ChurchProfile
from apps.departments.models import Department, Function
from apps.treasury.models import Caisse, CaisseAssignment, OfferingType, Transaction
from apps.workers.models import Attendance, Event, Task, Worker

User = get_user_model()

DEPARTMENTS = [
    ("Chorale", "CHO", "#8b5cf6", ["Choriste", "Chef de chœur", "Instrumentiste"]),
    ("Protocole", "PRO", "#06b6d4", ["Accueil", "Placement", "Sécurité"]),
    ("Intercession", "INT", "#ec4899", ["Intercesseur", "Veilleur"]),
    ("Média & Son", "MED", "#f59e0b", ["Technicien son", "Caméraman", "Régie"]),
    ("Évangélisation", "EVA", "#10b981", ["Évangéliste", "Équipe de suivi"]),
    ("École du dimanche", "ENF", "#3b82f6", ["Moniteur", "Assistant"]),
]

WORKERS = [
    ("Jean", "Mukendi", "M"), ("Grâce", "Ilunga", "F"), ("Daniel", "Kabasele", "M"),
    ("Esther", "Mbuyi", "F"), ("Patrick", "Tshibangu", "M"), ("Sarah", "Nzuzi", "F"),
    ("Emmanuel", "Kalala", "M"), ("Ruth", "Mwamba", "F"), ("Joseph", "Ngandu", "M"),
    ("Deborah", "Lukusa", "F"), ("Samuel", "Kanku", "M"), ("Marthe", "Bitota", "F"),
    ("David", "Mutombo", "M"), ("Rachel", "Kapinga", "F"), ("Josué", "Tshisekedi", "M"),
    ("Naomi", "Mujinga", "F"), ("Caleb", "Numbi", "M"), ("Anne", "Kasongo", "F"),
    ("Élie", "Mbomba", "M"), ("Judith", "Wetshi", "F"),
]

OFFERING_TYPES = [
    ("Offrande de culte", "CULTE"),
    ("Action de grâce", "GRACE"),
    ("Offrande de construction", "CONSTR"),
    ("Offrande missionnaire", "MISSION"),
    ("Première offrande", "PREMIER"),
]

DEMO_USERS = [
    ("pasteur@churchhub.local", "Paul", "Mananga", "Pasteur principal"),
    ("tresorier@churchhub.local", "Marie", "Kabeya", "Trésorier"),
    ("chef@churchhub.local", "Pierre", "Lumbu", "Chef de département"),
    ("secretaire@churchhub.local", "Sylvie", "Nkulu", "Secrétaire"),
]


class Command(BaseCommand):
    help = "Initialise permissions, rôles, compte admin et données de démonstration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--minimal",
            action="store_true",
            help="N'installe que permissions, rôles et compte admin (sans démo).",
        )

    @db_transaction.atomic
    def handle(self, *args, **options):
        random.seed(42)
        self.sync_permissions()
        self.sync_roles()
        self.ensure_admin()
        self.ensure_church_profile()
        if not options["minimal"]:
            self.seed_demo()
        self.stdout.write(self.style.SUCCESS("Seed termine avec succes."))
        self.stdout.write("  Admin : admin@churchhub.local / admin123")
        if not options["minimal"]:
            self.stdout.write("  Démo  : tresorier@churchhub.local / demo123 (et autres)")

    # ------------------------------------------------------------------ IAM
    def sync_permissions(self):
        for code, module, label in PERMISSIONS:
            Permission.objects.update_or_create(
                code=code, defaults={"module": module, "label": label}
            )
        self.stdout.write(f"  Permissions synchronisées : {Permission.objects.count()}")

    def sync_roles(self):
        for name, (description, codes) in DEFAULT_ROLES.items():
            role, _ = Role.objects.update_or_create(
                name=name, defaults={"description": description, "is_system": True}
            )
            perms = (
                Permission.objects.all()
                if codes == "ALL"
                else Permission.objects.filter(code__in=codes)
            )
            role.permissions.set(perms)
        self.stdout.write(f"  Rôles synchronisés : {Role.objects.count()}")

    def ensure_admin(self):
        admin, created = User.objects.get_or_create(
            email="admin@churchhub.local",
            defaults={
                "first_name": "Admin",
                "last_name": "ChurchHub",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
        role = Role.objects.filter(name="Administrateur").first()
        if role:
            admin.roles.add(role)
        return admin

    def ensure_church_profile(self):
        if not ChurchProfile.objects.exists():
            ChurchProfile.objects.create(
                name="Église Source de Vie",
                slogan="Aimer Dieu, servir les hommes",
                default_currency="CDF",
                phone="+243 810 000 000",
                email="contact@source-de-vie.org",
                address="Av. de la Libération, Kinshasa, RDC",
            )

    # ----------------------------------------------------------------- DEMO
    def seed_demo(self):
        for email, first, last, role_name in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=email, defaults={"first_name": first, "last_name": last, "is_active": True}
            )
            if created:
                user.set_password("demo123")
                user.save()
            role = Role.objects.filter(name=role_name).first()
            if role:
                user.roles.add(role)

        departments = {}
        functions = {}
        for name, code, color, fns in DEPARTMENTS:
            dept, _ = Department.objects.get_or_create(
                code=code,
                defaults={"name": name, "color": color, "description": f"Département {name}."},
            )
            departments[code] = dept
            functions[code] = []
            for fn in fns:
                func, _ = Function.objects.get_or_create(department=dept, name=fn)
                functions[code].append(func)

        codes = list(departments.keys())
        workers = []
        for first, last, gender in WORKERS:
            code = random.choice(codes)
            dept = departments[code]
            func = random.choice(functions[code])
            worker, _ = Worker.objects.get_or_create(
                first_name=first,
                last_name=last,
                defaults={
                    "gender": gender,
                    "department": dept,
                    "function": func,
                    "status": "active",
                    "phone": f"+243 9{random.randint(10000000, 99999999)}",
                    "join_date": timezone.localdate() - timedelta(days=random.randint(60, 1500)),
                },
            )
            workers.append(worker)

        # Responsables de département
        for code, dept in departments.items():
            if dept.leader is None:
                candidates = [w for w in workers if w.department_id == dept.id]
                if candidates:
                    dept.leader = candidates[0]
                    dept.save(update_fields=["leader"])

        offering_types = []
        for name, code in OFFERING_TYPES:
            ot, _ = OfferingType.objects.get_or_create(code=code, defaults={"name": name})
            offering_types.append(ot)

        caisse_principale, _ = Caisse.objects.get_or_create(
            code="PRINC",
            defaults={
                "name": "Caisse principale",
                "type": "principale",
                "opening_balance": Decimal("500000"),
            },
        )
        caisse_constr, _ = Caisse.objects.get_or_create(
            code="CONSTR",
            defaults={"name": "Projet Construction", "type": "projet"},
        )
        caisse_mission, _ = Caisse.objects.get_or_create(
            code="MISSION",
            defaults={"name": "Missions", "type": "mission"},
        )
        caisses = [caisse_principale, caisse_constr, caisse_mission]

        if workers:
            CaisseAssignment.objects.get_or_create(
                caisse=caisse_principale, worker=workers[1], defaults={"role": "caissier"}
            )
            CaisseAssignment.objects.get_or_create(
                caisse=caisse_principale, worker=workers[0], defaults={"role": "responsable"}
            )

        # Évènements (8 derniers dimanches) + présences
        if not Event.objects.exists():
            today = timezone.localdate()
            for week in range(8):
                event_date = today - timedelta(days=today.weekday() + 1 + week * 7)
                event = Event.objects.create(
                    name=f"Culte de célébration",
                    type="culte",
                    date=event_date,
                    location="Temple central",
                )
                for worker in workers:
                    status = random.choices(
                        ["present", "present", "present", "late", "absent", "excused"],
                        k=1,
                    )[0]
                    Attendance.objects.create(event=event, worker=worker, status=status)

        # Transactions (6 derniers mois)
        if not Transaction.objects.exists():
            today = timezone.localdate()
            for month_offset in range(6):
                ref_month = (today.replace(day=1) - timedelta(days=month_offset * 30)).replace(day=1)
                for _ in range(4):
                    day = ref_month + timedelta(days=random.randint(0, 27))
                    Transaction.objects.create(
                        caisse=caisse_principale,
                        category="offering",
                        offering_type=random.choice(offering_types),
                        amount=Decimal(random.randint(50, 400) * 1000),
                        date=day,
                        label="Offrande du culte",
                    )
                for _ in range(8):
                    day = ref_month + timedelta(days=random.randint(0, 27))
                    Transaction.objects.create(
                        caisse=caisse_principale,
                        category="tithe",
                        amount=Decimal(random.randint(20, 150) * 1000),
                        date=day,
                        label="Dîme",
                        contributor_worker=random.choice(workers) if workers else None,
                    )
                for _ in range(3):
                    day = ref_month + timedelta(days=random.randint(0, 27))
                    Transaction.objects.create(
                        caisse=caisse_principale,
                        category="expense",
                        amount=Decimal(random.randint(30, 200) * 1000),
                        date=day,
                        label=random.choice(
                            ["Loyer du temple", "Électricité", "Matériel de sonorisation", "Aide sociale"]
                        ),
                    )
                Transaction.objects.create(
                    caisse=caisse_constr,
                    category="donation",
                    amount=Decimal(random.randint(100, 500) * 1000),
                    date=ref_month + timedelta(days=random.randint(0, 27)),
                    label="Don pour la construction",
                )

        # Tâches
        if not Task.objects.exists() and workers:
            samples = [
                ("Préparer la liste des chants", "Chorale", "high", "in_progress"),
                ("Acheter le matériel de sonorisation", "Média & Son", "medium", "todo"),
                ("Organiser la sortie d'évangélisation", "Évangélisation", "high", "todo"),
                ("Mettre à jour la base des ouvriers", "Protocole", "low", "done"),
                ("Programme de jeûne mensuel", "Intercession", "medium", "in_progress"),
            ]
            dept_by_name = {d.name: d for d in Department.objects.all()}
            for title, dept_name, priority, status in samples:
                Task.objects.create(
                    title=title,
                    department=dept_by_name.get(dept_name),
                    worker=random.choice(workers),
                    priority=priority,
                    status=status,
                    due_date=timezone.localdate() + timedelta(days=random.randint(2, 30)),
                )

        self.stdout.write("  Données de démonstration créées.")
