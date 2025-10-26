#!/usr/bin/env python3
"""
Script per importare dati dal 2025 dalla vecchia applicazione.

Usage:
    python import_2025_data.py --json-file data_2025.json
    
Il file JSON deve avere questa struttura:
{
  "users": [
    {"username": "mario.rossi", "password": "temp123", "role": "user"}
  ],
  "orders": [
    {
      "title": "Ordine esempio",
      "amount": 150.50,
      "category": "Manutenzione",
      "order_date": "2025-03-15",
      "shift_id": 1,
      "season_id": 1,
      "status": "completed",
      "notes": "Note opzionali",
      "created_by": "mario.rossi"
    }
  ],
  "works": [
    {
      "title": "Lavoro esempio",
      "description": "Descrizione dettagliata",
      "category": "Pulizia",
      "work_date": "2025-03-15",
      "shift_id": 1,
      "season_id": 1,
      "status": "completed",
      "notes": "Note opzionali",
      "created_by": "mario.rossi"
    }
  ],
  "problems": [
    {
      "boat_id": 1,
      "description": "Problema motore",
      "part_affected": "Motore",
      "reported_date": "2025-03-15",
      "shift_id": 1,
      "season_id": 1,
      "status": "closed",
      "created_by": "mario.rossi"
    }
  ]
}
"""

import requests
import json
import argparse
from datetime import datetime
from typing import Dict, List, Any

# Configurazione
API_BASE_URL = "http://localhost:8000/api"
ADMIN_USERNAME = "admin"  # Modifica con le tue credenziali admin
ADMIN_PASSWORD = "admin"  # Modifica con le tue credenziali admin


class DataImporter:
    def __init__(self, base_url: str, admin_username: str, admin_password: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.admin_username = admin_username
        self.admin_password = admin_password
        
    def login(self) -> bool:
        """Login come admin per ottenere il token"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"username": self.admin_username, "password": self.admin_password}
            )
            response.raise_for_status()
            data = response.json()
            self.token = data.get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"✓ Login effettuato come {self.admin_username}")
            return True
        except Exception as e:
            print(f"✗ Errore durante il login: {e}")
            return False
    
    def create_user(self, user_data: Dict[str, Any]) -> bool:
        """Crea un nuovo utente"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=user_data
            )
            response.raise_for_status()
            print(f"  ✓ Utente creato: {user_data['username']}")
            return True
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 400:
                print(f"  ⚠ Utente già esistente: {user_data['username']}")
                return True  # Consideriamo OK se esiste già
            print(f"  ✗ Errore creazione utente {user_data['username']}: {e}")
            return False
        except Exception as e:
            print(f"  ✗ Errore creazione utente {user_data['username']}: {e}")
            return False
    
    def create_order(self, order_data: Dict[str, Any]) -> bool:
        """Crea un nuovo ordine"""
        try:
            response = self.session.post(
                f"{self.base_url}/orders",
                json=order_data
            )
            response.raise_for_status()
            print(f"  ✓ Ordine creato: {order_data['title'][:30]}...")
            return True
        except Exception as e:
            print(f"  ✗ Errore creazione ordine: {e}")
            return False
    
    def create_work(self, work_data: Dict[str, Any]) -> bool:
        """Crea un nuovo lavoro"""
        try:
            response = self.session.post(
                f"{self.base_url}/works",
                json=work_data
            )
            response.raise_for_status()
            print(f"  ✓ Lavoro creato: {work_data['title'][:30]}...")
            return True
        except Exception as e:
            print(f"  ✗ Errore creazione lavoro: {e}")
            return False
    
    def create_problem(self, problem_data: Dict[str, Any]) -> bool:
        """Crea un nuovo problema"""
        try:
            response = self.session.post(
                f"{self.base_url}/problems",
                json=problem_data
            )
            response.raise_for_status()
            print(f"  ✓ Problema creato: {problem_data['description'][:30]}...")
            return True
        except Exception as e:
            print(f"  ✗ Errore creazione problema: {e}")
            return False
    
    def import_data(self, data: Dict[str, Any]) -> Dict[str, int]:
        """Importa tutti i dati"""
        stats = {
            "users_created": 0,
            "orders_created": 0,
            "works_created": 0,
            "problems_created": 0,
            "errors": 0
        }
        
        # 1. Crea gli utenti
        print("\n📝 Importazione utenti...")
        for user in data.get("users", []):
            if self.create_user(user):
                stats["users_created"] += 1
            else:
                stats["errors"] += 1
        
        # 2. Crea gli ordini
        print("\n💰 Importazione ordini...")
        for order in data.get("orders", []):
            if self.create_order(order):
                stats["orders_created"] += 1
            else:
                stats["errors"] += 1
        
        # 3. Crea i lavori
        print("\n🔧 Importazione lavori...")
        for work in data.get("works", []):
            if self.create_work(work):
                stats["works_created"] += 1
            else:
                stats["errors"] += 1
        
        # 4. Crea i problemi
        print("\n⚠️  Importazione problemi...")
        for problem in data.get("problems", []):
            if self.create_problem(problem):
                stats["problems_created"] += 1
            else:
                stats["errors"] += 1
        
        return stats


def main():
    parser = argparse.ArgumentParser(description="Importa dati dal 2025")
    parser.add_argument("--json-file", required=True, help="File JSON con i dati da importare")
    parser.add_argument("--api-url", default=API_BASE_URL, help="URL base delle API")
    parser.add_argument("--admin-user", default=ADMIN_USERNAME, help="Username admin")
    parser.add_argument("--admin-pass", default=ADMIN_PASSWORD, help="Password admin")
    
    args = parser.parse_args()
    
    # Leggi il file JSON
    print(f"📂 Lettura file: {args.json_file}")
    try:
        with open(args.json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"✗ Errore lettura file: {e}")
        return 1
    
    # Crea l'importer e fai login
    importer = DataImporter(args.api_url, args.admin_user, args.admin_pass)
    if not importer.login():
        return 1
    
    # Importa i dati
    print("\n🚀 Inizio importazione...")
    stats = importer.import_data(data)
    
    # Mostra statistiche finali
    print("\n" + "="*50)
    print("📊 RIEPILOGO IMPORTAZIONE")
    print("="*50)
    print(f"✓ Utenti creati:    {stats['users_created']}")
    print(f"✓ Ordini creati:    {stats['orders_created']}")
    print(f"✓ Lavori creati:    {stats['works_created']}")
    print(f"✓ Problemi creati:  {stats['problems_created']}")
    print(f"✗ Errori:           {stats['errors']}")
    print("="*50)
    
    return 0 if stats['errors'] == 0 else 1


if __name__ == "__main__":
    exit(main())
