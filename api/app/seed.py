import datetime
import random
from functools import cache

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import clock
from app.accounts.models import User
from app.accounts.repository import create_user, get_user_by_email
from app.accounts.security import hash_password
from app.centers import repository as centers
from app.centers.models import Center, Membership, Role, Service
from app.db import SessionLocal
from app.scheduling.availability import slots_for_day
from app.scheduling.models import Appointment, AppointmentStatus, Modality
from app.scheduling.rut import format_rut

PASSWORD = "encuadrado2026"
ADMIN, MEMBER, VIEWER = Role.ADMIN, Role.MEMBER, Role.VIEWER

USERS = {
    "camila@aurora.cl": ("Camila", "Rojas", "Psicóloga clínica"),
    "matias@aurora.cl": ("Matías", "Fuentes", "Psicólogo infanto-juvenil"),
    "valentina@aurora.cl": ("Valentina", "Soto", "Psicóloga y nutricionista"),
    "recepcion@aurora.cl": ("Ignacio", "Pérez", "Recepcionista"),
    "francisca@nutrir.cl": ("Francisca", "Muñoz", "Nutricionista clínica"),
    "diego@nutrir.cl": ("Diego", "Herrera", "Nutricionista deportivo"),
    "recepcion@nutrir.cl": ("Antonia", "Lagos", "Recepcionista"),
}

CENTERS = [
    {
        "slug": "centro-aurora",
        "name": "Centro Aurora",
        "description": (
            "Centro de salud mental en Providencia con atención psicológica para adultos, "
            "parejas y adolescentes. Trabajamos con equipos clínicos que acompañan cada "
            "proceso de manera cercana y confidencial."
        ),
        "opening_time": datetime.time(9, 0),
        "closing_time": datetime.time(19, 0),
        "terms": (
            "La atención está disponible para mayores de 18 años o menores acompañados por "
            "su tutor legal.\n"
            "Las citas pueden cancelarse o reagendarse con al menos 24 horas de anticipación.\n"
            "La inasistencia sin aviso no da derecho a devolución del valor de la sesión.\n"
            "Los datos personales se tratan conforme a la Ley 21.719 y solo para la gestión "
            "de tu atención."
        ),
        "contact": {
            "address": "Av. Providencia 1234, oficina 502",
            "commune": "Providencia",
            "phone": "+56 2 2345 6789",
            "email": "contacto@centroaurora.cl",
        },
        "members": [
            ("camila@aurora.cl", ADMIN),
            ("matias@aurora.cl", MEMBER),
            ("valentina@aurora.cl", MEMBER),
            ("recepcion@aurora.cl", VIEWER),
        ],
        "services": [
            ("Sesión psicológica", 35000, 45),
            ("Terapia de parejas", 55000, 60),
            ("Evaluación psicológica", 45000, 60),
        ],
    },
    {
        "slug": "clinica-nutrir",
        "name": "Clínica Nutrir",
        "description": (
            "Clínica de nutrición en Ñuñoa con planes alimentarios personalizados para "
            "control de peso, alimentación saludable y rendimiento deportivo. Atendemos "
            "de forma presencial y con seguimiento continuo."
        ),
        "opening_time": datetime.time(8, 30),
        "closing_time": datetime.time(17, 30),
        "terms": (
            "La atención está disponible para mayores de 18 años o menores acompañados por "
            "su tutor legal.\n"
            "Las citas pueden cancelarse o reagendarse con al menos 24 horas de anticipación.\n"
            "La inasistencia sin aviso no da derecho a devolución del valor de la consulta.\n"
            "Los datos personales y de salud se tratan conforme a la Ley 21.719 y solo para "
            "la gestión de tu atención."
        ),
        "contact": {
            "address": "Av. Apoquindo 4500, piso 3",
            "commune": "Las Condes",
            "phone": "+56 2 2987 6543",
            "email": "hola@clinicanutrir.cl",
        },
        "members": [
            ("francisca@nutrir.cl", ADMIN),
            ("valentina@aurora.cl", ADMIN),
            ("diego@nutrir.cl", MEMBER),
            ("recepcion@nutrir.cl", VIEWER),
        ],
        "services": [
            ("Consulta nutricional", 30000, 45),
            ("Control nutricional", 20000, 30),
            ("Plan deportivo", 40000, 60),
        ],
    },
]

PATIENTS = [
    ("Sofía González", "sofia.gonzalez@correo.cl"),
    ("Joaquín Martínez", "joaquin.martinez@correo.cl"),
    ("Javiera Contreras", "javiera.contreras@correo.cl"),
    ("Benjamín Silva", "benjamin.silva@correo.cl"),
    ("Constanza Araya", "constanza.araya@correo.cl"),
    ("Sebastián Vargas", "sebastian.vargas@correo.cl"),
    ("Catalina Morales", "catalina.morales@correo.cl"),
    ("Tomás Espinoza", "tomas.espinoza@correo.cl"),
    ("Fernanda Castillo", "fernanda.castillo@correo.cl"),
    ("Nicolás Tapia", "nicolas.tapia@correo.cl"),
    ("Daniela Reyes", "daniela.reyes@correo.cl"),
    ("Felipe Núñez", "felipe.nunez@correo.cl"),
]


@cache
def demo_password_hash() -> str:
    return hash_password(PASSWORD)


def get_or_create_user(session: Session, email: str, first_name: str, last_name: str, title: str) -> User:
    user = get_user_by_email(session, email)
    if user is None:
        user = create_user(session, email, first_name=first_name, last_name=last_name, title=title)
        user.password = demo_password_hash()
    return user


def get_or_create_center(session: Session, spec: dict) -> Center:
    center = centers.get_center_by_slug(session, spec["slug"])
    if center is None:
        fields = {key: spec[key] for key in ("name", "description", "opening_time", "closing_time", "terms")}
        center = Center(slug=spec["slug"], **fields, **spec["contact"])
        session.add(center)
        session.flush()
    return center


def ensure_membership(session: Session, user: User, center: Center, role: Role) -> None:
    if centers.get_membership(session, user.id, center.id) is None:
        session.add(Membership(user_id=user.id, center_id=center.id, role=role))


def ensure_service(session: Session, center: Center, name: str, price: int, duration: int) -> None:
    exists = session.scalar(select(Service.id).where(Service.center_id == center.id, Service.name == name))
    if exists is None:
        session.add(Service(center_id=center.id, name=name, price_clp=price, duration_minutes=duration))


def has_future_appointments(session: Session, center: Center, now: datetime.datetime) -> bool:
    return session.scalar(
        select(Appointment.id)
        .where(
            Appointment.center_id == center.id,
            Appointment.status == AppointmentStatus.CONFIRMED,
            Appointment.start >= now,
        )
        .limit(1)
    ) is not None


def create_appointments(session: Session, center: Center, now: datetime.datetime) -> int:
    rng = random.Random(2026)
    professionals = centers.bookable_memberships(session, center.id)
    services = centers.active_services(session, center.id)
    target = rng.randint(8, 12)
    created = 0
    for _ in range(target * 5):
        if created == target:
            break
        professional = rng.choice(professionals)
        service = rng.choice(services)
        day = (now + datetime.timedelta(days=rng.randint(1, 14))).date()
        slots = slots_for_day(session, professional, service, day, now)
        if not slots:
            continue
        start = rng.choice(slots)
        name, email = PATIENTS[created % len(PATIENTS)]
        session.add(
            Appointment(
                center_id=center.id,
                professional_id=professional.id,
                service_id=service.id,
                start=start,
                end=start + datetime.timedelta(minutes=service.duration_minutes),
                patient_name=name,
                patient_email=email,
                patient_phone=f"+569{rng.randint(10000000, 99999999)}",
                modality=rng.choice(list(Modality)),
                patient_rut=format_rut(rng.randint(8_000_000, 25_000_000)),
                patient_birth_date=datetime.date(
                    rng.randint(1960, 2005), rng.randint(1, 12), rng.randint(1, 28)
                ),
                terms_accepted_at=now,
                data_consent_at=now,
            )
        )
        session.flush()
        created += 1
    return created


def run(session: Session) -> dict[str, int]:
    now = clock.local_now()
    users = {email: get_or_create_user(session, email, *data) for email, data in USERS.items()}
    created = 0
    for spec in CENTERS:
        center = get_or_create_center(session, spec)
        for email, role in spec["members"]:
            ensure_membership(session, users[email], center, role)
        for name, price, duration in spec["services"]:
            ensure_service(session, center, name, price, duration)
        session.flush()
        if not has_future_appointments(session, center, now):
            created += create_appointments(session, center, now)
    session.commit()
    return {
        "users": session.scalar(select(func.count()).select_from(User)),
        "centers": session.scalar(select(func.count()).select_from(Center)),
        "services": session.scalar(select(func.count()).select_from(Service)),
        "appointments": created,
    }


if __name__ == "__main__":
    with SessionLocal() as session:
        counts = run(session)
    print(
        f"Datos cargados: {counts['users']} usuarios, {counts['centers']} centros, "
        f"{counts['services']} servicios, {counts['appointments']} agendamientos nuevos."
    )
