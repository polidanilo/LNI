import sys
import os

# Aggiungi il path del backend al PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, engine
from sqlalchemy import text

def add_unique_constraint():
    """
    Aggiunge vincolo di unicità su (season_id, shift_number) nella tabella shifts
    """
    db = SessionLocal()
    
    try:
        print("🔧 Aggiunta vincolo di unicità su shifts...")
        
        # Verifica se il vincolo esiste già
        check_query = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'shifts' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name = 'unique_season_shift_number';
        """)
        
        result = db.execute(check_query).fetchone()
        
        if result:
            print("ℹ️  Vincolo già esistente, skip")
            return
        
        # Aggiungi vincolo di unicità
        alter_query = text("""
            ALTER TABLE shifts 
            ADD CONSTRAINT unique_season_shift_number 
            UNIQUE (season_id, shift_number);
        """)
        
        db.execute(alter_query)
        db.commit()
        
        print("✅ Vincolo di unicità aggiunto con successo!")
        print("   Ora non è più possibile inserire turni duplicati per la stessa stagione")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Errore: {e}")
        print("\n💡 Suggerimento: Assicurati di aver prima eliminato i duplicati con clean_duplicate_shifts.py")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    add_unique_constraint()
