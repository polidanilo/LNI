#!/usr/bin/env python3
"""
Script per convertire file CSV in formato JSON per l'importazione.

Usage:
    python csv_to_json.py --users users.csv --orders orders.csv --works works.csv --problems problems.csv --output data_2025.json

Formato CSV richiesto:

users.csv:
username,password,role
mario.rossi,temp2025,user

orders.csv:
title,amount,category,order_date,shift_id,season_id,status,notes,created_by
Rifornimento,250.00,Carburante,2025-01-15,1,1,completed,Note,mario.rossi

works.csv:
title,description,category,work_date,shift_id,season_id,status,notes,created_by
Pulizia,Descrizione,Pulizia,2025-01-15,1,1,completed,Note,mario.rossi

problems.csv:
boat_id,description,part_affected,reported_date,shift_id,season_id,status,created_by
1,Problema motore,Motore,2025-01-15,1,1,closed,mario.rossi
"""

import csv
import json
import argparse
from typing import Dict, List, Any


def read_csv_to_dict(filepath: str) -> List[Dict[str, Any]]:
    """Legge un file CSV e restituisce una lista di dizionari"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    except FileNotFoundError:
        print(f"⚠️  File non trovato: {filepath}")
        return []
    except Exception as e:
        print(f"✗ Errore lettura {filepath}: {e}")
        return []


def convert_types(data: List[Dict[str, Any]], conversions: Dict[str, type]) -> List[Dict[str, Any]]:
    """Converte i tipi di dato secondo le specifiche"""
    result = []
    for row in data:
        converted = {}
        for key, value in row.items():
            if key in conversions:
                try:
                    if conversions[key] == float:
                        converted[key] = float(value) if value else 0.0
                    elif conversions[key] == int:
                        converted[key] = int(value) if value else 0
                    elif conversions[key] == bool:
                        converted[key] = value.lower() in ('true', '1', 'yes', 'si', 'sì')
                    else:
                        converted[key] = value
                else:
                    print(f"⚠️  Errore conversione {key}={value}, uso valore originale")
                    converted[key] = value
            else:
                converted[key] = value
        result.append(converted)
    return result


def main():
    parser = argparse.ArgumentParser(description="Converti CSV in JSON per importazione")
    parser.add_argument("--users", help="File CSV con gli utenti")
    parser.add_argument("--orders", help="File CSV con gli ordini")
    parser.add_argument("--works", help="File CSV con i lavori")
    parser.add_argument("--problems", help="File CSV con i problemi")
    parser.add_argument("--output", default="data_2025.json", help="File JSON di output")
    
    args = parser.parse_args()
    
    # Leggi i file CSV
    data = {
        "users": [],
        "orders": [],
        "works": [],
        "problems": []
    }
    
    if args.users:
        print(f"📂 Lettura utenti da: {args.users}")
        users = read_csv_to_dict(args.users)
        data["users"] = users
        print(f"  ✓ {len(users)} utenti letti")
    
    if args.orders:
        print(f"📂 Lettura ordini da: {args.orders}")
        orders = read_csv_to_dict(args.orders)
        # Converti i tipi
        orders = convert_types(orders, {
            "amount": float,
            "shift_id": int,
            "season_id": int
        })
        data["orders"] = orders
        print(f"  ✓ {len(orders)} ordini letti")
    
    if args.works:
        print(f"📂 Lettura lavori da: {args.works}")
        works = read_csv_to_dict(args.works)
        # Converti i tipi
        works = convert_types(works, {
            "shift_id": int,
            "season_id": int
        })
        data["works"] = works
        print(f"  ✓ {len(works)} lavori letti")
    
    if args.problems:
        print(f"📂 Lettura problemi da: {args.problems}")
        problems = read_csv_to_dict(args.problems)
        # Converti i tipi
        problems = convert_types(problems, {
            "boat_id": int,
            "shift_id": int,
            "season_id": int
        })
        data["problems"] = problems
        print(f"  ✓ {len(problems)} problemi letti")
    
    # Scrivi il file JSON
    print(f"\n💾 Scrittura file JSON: {args.output}")
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✓ File creato con successo!")
        print(f"\nPuoi ora importare i dati con:")
        print(f"  python import_2025_data.py --json-file {args.output}")
    except Exception as e:
        print(f"✗ Errore scrittura file: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
