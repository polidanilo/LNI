import os
from app.db.session import SessionLocal, engine
from app.db.models import Season, Shift, Boat, BoatPart
from app.db.base import Base
from sqlalchemy import Enum
import enum

# Assumo che tu abbia un enum BoatType nei tuoi models
# Se non ce l'hai, commentalo e usa stringhe
try:
    from app.db.models import BoatType
except ImportError:
    # Se non hai l'enum, crealo qui temporaneamente
    class BoatType(str, enum.Enum):
        GOMMONE = "gommone"
        OPTIMIST = "optimist"
        FLY = "fly"
        EQUIPE = "equipe"
        CARAVELLE = "caravelle"
        TRIDENT = "trident"

def seed_database():
    print("🌱 Inizio popolamento database...")
    
    # Crea tutte le tabelle se non esistono
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ========== STAGIONI ==========
        print("📅 Creazione stagione 2025...")
        
        # Controlla se esiste già
        existing_season = db.query(Season).filter(Season.year == 2025).first()
        if existing_season:
            print("⚠️  Stagione 2025 già esistente, salto...")
            season_2025 = existing_season
        else:
            season_2025 = Season(
                name="2025",
                year=2025,
                start_date="2025-01-01",
                end_date="2025-12-31",
                is_active=True
            )
            db.add(season_2025)
            db.flush()  # Per ottenere l'ID
            print("✅ Stagione 2025 creata!")
        
        # ========== TURNI ==========
        print("📋 Creazione turni da Primo a Sesto...")
        
        existing_shifts = db.query(Shift).filter(Shift.season_id == season_2025.id).count()
        if existing_shifts > 0:
            print("⚠️  Turni già esistenti, salto...")
        else:
            for i in range(1, 7):
                shift = Shift(
                    season_id=season_2025.id,
                    shift_number=i,
                    start_date=f"2025-0{(i-1)//2 + 1}-{15 if i % 2 == 1 else 1}",
                    end_date=f"2025-0{(i-1)//2 + 1}-{28 if i % 2 == 0 else 14}"
                )
                db.add(shift)
            print("✅ 6 turni creati!")
        
        # ========== IMBARCAZIONI ==========
        print("⛵ Creazione imbarcazioni...")
        
        # Controlla se già esistono
        gommoni_count = db.query(Boat).filter(Boat.type == BoatType.GOMMONE).count()
        if gommoni_count > 0:
            print("⚠️  Imbarcazioni già esistenti, salto...")
        else:
            # Gommoni
            gommoni = [
                "Gommorizzo giallo (Honda 1)",
                "Gommorizzo blu (Suzuki 3)",
                "Gommorizzo rosso (Suzuki 2)",
                "Forsea",
                "Marshall",
                "Staff Only (Honda 2)",
                "Arancio 1 (Suzuki 1)",
                "Arancio 1 (Evinrude)",
                "Arancio 3 (Johnson)",
            ]
            
            # Optimist (1-20 + Openbic)
            optimist = [f"Optimist {i}" for i in range(1, 21)]
            optimist.append("Openbic")
            
            # Fly (A-T excluding J, K + Ultimo, X, Y, Z, Anna F, K + N1-N11)
            fly_names = [chr(65 + i) for i in range(20) if chr(65 + i) not in ['J', 'K']]
            fly_names.extend(["Ultimo", "X", "Y", "Z", "Anna F", "K"])
            fly_names.extend([f"N{i}" for i in range(1, 12)])
            
            # Equipe (1-13)
            equipe = [f"Equipe {i}" for i in range(1, 14)]
            
            # Caravelle
            caravelle = ["Roma", "Pinta", "Carla"]
            
            # Trident (1-4)
            trident = [f"Trident {i}" for i in range(1, 5)]
            
            # Combine all boats with their types
            boats_data = [
                (name, BoatType.GOMMONE) for name in gommoni
            ] + [
                (name, BoatType.OPTIMIST) for name in optimist
            ] + [
                (name, BoatType.FLY) for name in fly_names
            ] + [
                (name, BoatType.EQUIPE) for name in equipe
            ] + [
                (name, BoatType.CARAVELLE) for name in caravelle
            ] + [
                (name, BoatType.TRIDENT) for name in trident
            ]
            
            # Insert boats
            for name, boat_type in boats_data:
                boat = Boat(name=name, type=boat_type)
                db.add(boat)
            
            print(f"✅ {len(boats_data)} imbarcazioni create!")
        
        # ========== PARTI IMBARCAZIONI ==========
        print("🔧 Creazione parti imbarcazioni...")
        
        existing_parts = db.query(BoatPart).count()
        if existing_parts > 0:
            print("⚠️  Parti già esistenti, salto...")
        else:
            boat_parts = {
                BoatType.GOMMONE: ["Battello", "Motore", "Altro"],
                BoatType.OPTIMIST: ["Albero", "Circuito", "Deriva", "Picco", "Randa", "Scafo", "Timone", "Altro"],
                BoatType.FLY: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.EQUIPE: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.CARAVELLE: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.TRIDENT: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
            }
            
            total_parts = 0
            for boat_type, parts in boat_parts.items():
                for part_name in parts:
                    boat_part = BoatPart(boat_type=boat_type, part_name=part_name)
                    db.add(boat_part)
                    total_parts += 1
            
            print(f"✅ {total_parts} parti create!")
        
        # Commit finale
        db.commit()
        
        print("\n✅ Database popolato con successo!")
        print("   - 1 stagione (2025)")
        print("   - 6 turni")
        print("   - ~80 imbarcazioni")
        print("   - ~100 parti imbarcazioni")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()