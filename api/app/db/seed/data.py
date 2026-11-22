import datetime

from app.centers.models import Role

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
            ("Sesión psicológica", 35000, 45, "Atención individual para acompañar procesos emocionales, ansiedad o estrés."),
            ("Terapia de parejas", 55000, 60, "Espacio para mejorar la comunicación y resolver conflictos en pareja."),
            ("Evaluación psicológica", 45000, 60, "Evaluación clínica con informe para orientar el diagnóstico y el tratamiento."),
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
            ("Consulta nutricional", 30000, 45, "Evaluación inicial de hábitos y un plan de alimentación personalizado."),
            ("Control nutricional", 20000, 30, "Seguimiento de avances y ajustes al plan de alimentación."),
            ("Plan deportivo", 40000, 60, "Plan de alimentación según tu entrenamiento y objetivos deportivos."),
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
