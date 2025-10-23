import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.models import Shift, Season

db = SessionLocal()

print('=== STAGIONI ===')
seasons = db.query(Season).all()
for s in seasons:
    print(f'ID: {s.id}, Nome: {s.name}, Anno: {s.year}')

print('\n=== TURNI ===')
shifts = db.query(Shift).order_by(Shift.season_id, Shift.shift_number).all()
for sh in shifts:
    print(f'ID: {sh.id}, Season: {sh.season_id}, Turno: {sh.shift_number}, Date: {sh.start_date} -> {sh.end_date}')

print(f'\n=== TOTALE TURNI: {len(shifts)} ===')

db.close()
