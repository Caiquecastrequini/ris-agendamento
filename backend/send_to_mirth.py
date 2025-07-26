import sqlite3
import xml.etree.ElementTree as ET
import requests
import time
import sys
import os

DB_PATH = r"C:\Users\shopm\OneDrive\Documentos\GitHub\ris-agendamento\backend\ris.db"
MIRTH_URL = 'http://localhost:8090/'
HEADERS = {'Content-Type': 'application/xml'}
LAST_SENT_FILE = "last_sent_id.txt"  # arquivo para salvar último ID enviado

def get_last_sent_id():
    if os.path.exists(LAST_SENT_FILE):
        with open(LAST_SENT_FILE, "r") as f:
            try:
                return int(f.read().strip())
            except:
                return 0
    return 0

def save_last_sent_id(id_):
    with open(LAST_SENT_FILE, "w") as f:
        f.write(str(id_))

def main():
    print("Iniciando monitoramento e envio para Mirth...")

    while True:
        try:
            last_sent_id = get_last_sent_id()
            print(f"\nÚltimo ID enviado: {last_sent_id}")

            print("Conectando ao banco SQLite...")
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            print("Conectado com sucesso!")

            # Buscar registros com id maior que o último enviado
            cursor.execute(
                'SELECT id, patientName, patientId, examType, examDate, examTime, createdAt FROM ris WHERE id > ? ORDER BY id',
                (last_sent_id,)
            )
            rows = cursor.fetchall()

            if not rows:
                print("Nenhum novo dado para enviar.")
            else:
                print(f"Encontrados {len(rows)} novo(s) registro(s). Enviando para Mirth...")

                for row in rows:
                    patient = ET.Element('patient')
                    ET.SubElement(patient, 'id').text = str(row[0])
                    ET.SubElement(patient, 'patientName').text = row[1]
                    ET.SubElement(patient, 'patientId').text = row[2]
                    ET.SubElement(patient, 'examType').text = row[3]
                    ET.SubElement(patient, 'examDate').text = row[4]
                    ET.SubElement(patient, 'examTime').text = row[5]
                    ET.SubElement(patient, 'createdAt').text = row[6]

                    xml_data = ET.tostring(patient, encoding='utf-8', method='xml')

                    print(f"\nEnviando XML do paciente '{row[1]}' para Mirth:")
                    print(xml_data.decode())

                    try:
                        response = requests.post(MIRTH_URL, data=xml_data, headers=HEADERS, timeout=10)
                        if response.status_code == 200:
                            print(f"✔️ Enviado com sucesso! Status: {response.status_code}")
                            save_last_sent_id(row[0])  # Atualiza o último id enviado só se sucesso
                        else:
                            print(f"❌ Falha ao enviar! Status: {response.status_code} - {response.text}")
                    except requests.exceptions.RequestException as e:
                        print(f"❌ Erro ao enviar para o Mirth: {e}")

            conn.close()
            print("Conexão com o banco fechada.")

            print("\nAguardando 10 segundos para próxima verificação...")
            time.sleep(10)

        except KeyboardInterrupt:
            print("\n⚠️ Execução interrompida pelo usuário (Ctrl+C). Finalizando...")
            sys.exit(0)
        except Exception as e:
            print(f"❌ Erro geral: {e}")
            print("Tentando reconectar em 10 segundos...")
            time.sleep(10)

if __name__ == "__main__":
    main()
