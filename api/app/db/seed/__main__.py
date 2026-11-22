from app.db.seed.loaders import run
from app.db.session import SessionLocal

with SessionLocal() as session:
    counts = run(session)
print(
    f"Datos cargados: {counts['users']} usuarios, {counts['centers']} centros, "
    f"{counts['services']} servicios, {counts['appointments']} agendamientos nuevos."
)
