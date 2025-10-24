import os
from app.db.session import SessionLocal, engine
from app.db.models import Season, Shift, Boat, BoatPart, BoatType
from app.db.base import Base
from datetime import date

def seed_database():
    print("🌱 Inizio popolamento database...")
    
    # Crea tutte le tabelle se non esistono
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # ========== STAGIONI ==========
        print("📅 Creazione stagione 2025...")
        
        existing_season = db.query(Season).filter(Season.year == 2025).first()
        if existing_season:
            print("⚠️  Stagione 2025 già esistente, salto...")
            season_2025 = existing_season
        else:
            season_2025 = Season(
                name="2025",
                year=2025
            )
            db.add(season_2025)
            db.flush()
            print("✅ Stagione 2025 creata!")
        
        # ========== TURNI ==========
        print("📋 Creazione turni da Primo a Sesto...")
        
        existing_shifts = db.query(Shift).filter(Shift.season_id == season_2025.id).count()
        if existing_shifts > 0:
            print("⚠️  Turni già esistenti, salto...")
        else:
            shifts_data = [
                (1, date(2025, 6, 1), date(2025, 6, 14)),
                (2, date(2025, 6, 15), date(2025, 6, 28)),
                (3, date(2025, 6, 29), date(2025, 7, 12)),
                (4, date(2025, 7, 13), date(2025, 7, 26)),
                (5, date(2025, 7, 27), date(2025, 8, 9)),
                (6, date(2025, 8, 10), date(2025, 8, 23)),
            ]
            
            for shift_num, start, end in shifts_data:
                shift = Shift(
                    season_id=season_2025.id,
                    shift_number=shift_num,
                    start_date=start,
                    end_date=end
                )
                db.add(shift)
            print("✅ 6 turni creati!")
        
        # ========== IMBARCAZIONI ==========
        print("⛵ Creazione imbarcazioni...")
        
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
                "Arancio 2 (Evinrude)",
                "Arancio 3 (Johnson)",
            ]
            
            # Optimist (1-20 + Openbic)
            optimist = [f"Optimist {i}" for i in range(1, 21)]
            optimist.append("Openbic")
            
            # Fly (A-T escludendo J, K + speciali)
            fly_names = [chr(65 + i) for i in range(20) if chr(65 + i) not in ['J', 'K']]
            fly_names.extend(["Ultimo", "X", "Y", "Z", "Anna F", "K"])
            fly_names.extend([f"N{i}" for i in range(1, 12)])
            
            # Equipe (1-13)
            equipe = [f"Equipe {i}" for i in range(1, 14)]
            
            # Caravelle
            caravelle = ["Roma", "Pinta", "Carla"]
            
            # Trident (1-4)
            trident = [f"Trident {i}" for i in range(1, 5)]
            
            # Combine all boats
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
                BoatType.FLY: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco", "Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.EQUIPE: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco", "Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.CARAVELLE: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco", "Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
                BoatType.TRIDENT: ["Albero", "Crocette", "Deriva", "Drizza Fiocco", "Drizza Randa", "Fiocco", "Randa", "Sartiame", "Scafo", "Scotta Fiocco", "Scotta Randa", "Stecche", "Timone", "Altro"],
            }
            
            total_parts = 0
            for boat_type, parts in boat_parts.items():
                for part_name in parts:
                    boat_part = BoatPart(boat_type=boat_type, part_name=part_name)
                    db.add(boat_part)
                    total_parts += 1
            
            print(f"✅ {total_parts} parti create!")
        
        db.commit()
        
        print("\n✅ Database popolato con successo!")
        print("   - 1 stagione (2025)")
        print("   - 6 turni")
        print("   - ~80 imbarcazioni")
        print("   - ~70 parti imbarcazioni")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()