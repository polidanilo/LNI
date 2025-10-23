import sys
import os

# Aggiungi il path del backend al PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import Shift, Season
from sqlalchemy import func

def clean_duplicate_shifts():
    """
    Rimuove turni duplicati mantenendo solo il primo inserito per ogni (season_id, shift_number)
    """
    db = SessionLocal()
    
    try:
        print("🔍 Analisi turni duplicati...")
        
        # Trova turni duplicati
        duplicates = db.query(
            Shift.season_id,
            Shift.shift_number,
            func.count(Shift.id).label('count')
        ).group_by(
            Shift.season_id,
            Shift.shift_number
        ).having(
            func.count(Shift.id) > 1
        ).all()
        
        if not duplicates:
            print("✅ Nessun turno duplicato trovato!")
            return
        
        print(f"\n⚠️  Trovati {len(duplicates)} gruppi di turni duplicati:")
        for dup in duplicates:
            season = db.query(Season).filter(Season.id == dup.season_id).first()
            season_name = season.name if season else f"ID {dup.season_id}"
            print(f"   - Stagione '{season_name}', Turno {dup.shift_number}: {dup.count} copie")
        
        # Chiedi conferma
        confirm = input("\n❓ Vuoi eliminare i duplicati? (mantiene solo il primo inserito) [s/N]: ")
        if confirm.lower() != 's':
            print("❌ Operazione annullata")
            return
        
        # Elimina duplicati
        deleted_count = 0
        for dup in duplicates:
            # Trova tutti i turni duplicati per questo gruppo
            shifts = db.query(Shift).filter(
                Shift.season_id == dup.season_id,
                Shift.shift_number == dup.shift_number
            ).order_by(Shift.id).all()
            
            # Mantieni il primo, elimina gli altri
            for shift in shifts[1:]:
                print(f"   🗑️  Eliminando turno ID {shift.id} (Stagione {shift.season_id}, Turno {shift.shift_number})")
                db.delete(shift)
                deleted_count += 1
        
        db.commit()
        print(f"\n✅ Eliminati {deleted_count} turni duplicati!")
        
        # Mostra riepilogo finale
        print("\n📊 Riepilogo turni per stagione:")
        seasons = db.query(Season).all()
        for season in seasons:
            shifts = db.query(Shift).filter(Shift.season_id == season.id).order_by(Shift.shift_number).all()
            print(f"\n   {season.name} ({season.year}):")
            for shift in shifts:
                print(f"      - Turno {shift.shift_number}: {shift.start_date} → {shift.end_date}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Errore: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    clean_duplicate_shifts()
