import os
from app import app, db
from app.db.models import Season, Shift

def seed_database():
    with app.app_context():
        print("🌱 Inizio popolamento database...")
        
        # Verifica se i dati esistono già
        if Season.query.first():
            print("⚠️  Database già popolato. Cancellando dati esistenti...")
            # Opzionale: cancella tutto prima
            # db.drop_all()
            # db.create_all()
        
        # ========== STAGIONI ==========
        print("📅 Creazione stagione 2025...")
        season_2025 = Season(
            name="2025",
            year=2025,
            start_date="2025-01-01",
            end_date="2025-12-31",
            is_active=True
        )
        db.session.add(season_2025)
        db.session.flush()  # Per ottenere l'ID della stagione
        
        # ========== TURNI ==========
        print("📋 Creazione turni da Primo a Sesto...")
        shift_names = ["Primo", "Secondo", "Terzo", "Quarto", "Quinto", "Sesto"]
        shifts = []
        for i in range(1, 7):
            shift = Shift(
                season_id=season_2025.id,
                shift_number=i,
                start_date=f"2025-0{(i-1)//2 + 1}-{15 if i % 2 == 1 else 1}",  # Date fittizie
                end_date=f"2025-0{(i-1)//2 + 1}-{28 if i % 2 == 0 else 14}"
            )
            shifts.append(shift)
            db.session.add(shift)
        
        # ========== CATEGORIE BARCHE (COMMENTATO) ==========
        # Le categorie barche, lavori e ordini vengono create tramite l'applicazione
        # Non è necessario popolarle qui
        
        # Commit finale
        db.session.commit()
        
        print("✅ Database popolato con successo!")
        print(f"   - 1 stagione (2025)")
        print(f"   - {len(shifts)} turni (da Primo a Sesto)")

if __name__ == '__main__':
    seed_database()