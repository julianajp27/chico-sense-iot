import os
import time
import serial
import paho.mqtt.client as mqtt
from dotenv import load_dotenv


# ==========================================
# CONFIGURAÇÃO DO ARQUIVO .env
# ==========================================

# O teste_thingspeak.py está dentro da pasta "python".
# O .env está uma pasta acima, na raiz "chico-sense-iot".

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

ENV_PATH = os.path.join(BASE_DIR, ".env")

# Carrega as credenciais do arquivo .env
load_dotenv(ENV_PATH)


# ==========================================
# CONFIGURAÇÕES DA PORTA SERIAL
# ==========================================

PORTA_SERIAL = "COM5"
VELOCIDADE = 115200


# ==========================================
# CREDENCIAIS MQTT
# ==========================================

CLIENT_ID = os.getenv("MQTT_CLIENT_ID")
USERNAME = os.getenv("MQTT_USERNAME")
PASSWORD = os.getenv("MQTT_PASSWORD")


# ==========================================
# CONFIGURAÇÕES DO THINGSPEAK
# ==========================================

CHANNEL_ID = "3493148"

MQTT_SERVER = "mqtt3.thingspeak.com"
MQTT_PORT = 1883

TOPICO = f"channels/{CHANNEL_ID}/publish"


# ==========================================
# VERIFICAÇÃO DAS CREDENCIAIS
# ==========================================

if not CLIENT_ID or not USERNAME or not PASSWORD:
    raise RuntimeError(
        "Credenciais MQTT não encontradas. "
        "Verifique o arquivo .env."
    )


# ==========================================
# CONFIGURAÇÃO DO CLIENTE MQTT
# ==========================================

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID
)

client.username_pw_set(
    USERNAME,
    PASSWORD
)


# ==========================================
# CONEXÃO COM O THINGSPEAK
# ==========================================

print("Conectando ao ThingSpeak...")

try:

    client.connect(
        MQTT_SERVER,
        MQTT_PORT,
        60
    )

    client.loop_start()

    # Aguarda a conexão MQTT
    time.sleep(2)

    print("Conexão MQTT iniciada!")

except Exception as erro:

    print("Erro ao conectar ao ThingSpeak:")
    print(erro)

    raise


# ==========================================
# CONEXÃO COM A ESP32 PELA USB
# ==========================================

print(f"Abrindo {PORTA_SERIAL}...")

try:

    esp32 = serial.Serial(
        PORTA_SERIAL,
        VELOCIDADE,
        timeout=2
    )

except serial.SerialException as erro:

    print(
        f"Não foi possível abrir "
        f"{PORTA_SERIAL}."
    )

    print(
        "Verifique se o Monitor Serial "
        "do Arduino está fechado."
    )

    print(erro)

    client.loop_stop()

    try:
        client.disconnect()
    except Exception:
        pass

    raise


# Aguarda a ESP32 iniciar a comunicação
time.sleep(2)

print("ESP32 conectada pela USB!")
print("Aguardando leituras do DHT11...")
print("--------------------------------")


# ==========================================
# FUNÇÃO DE RECONEXÃO MQTT
# ==========================================

def reconectar_mqtt():

    print(
        "Conexão MQTT perdida. "
        "Tentando reconectar..."
    )

    while True:

        try:

            client.reconnect()

            # Aguarda a reconexão
            time.sleep(2)

            if client.is_connected():

                print(
                    "Reconectado ao ThingSpeak!"
                )

                return

        except Exception as erro:

            print(
                "Falha na reconexão:",
                erro
            )

        print(
            "Nova tentativa em 5 segundos..."
        )

        time.sleep(5)


# ==========================================
# LEITURA DO DHT11 E ENVIO AO THINGSPEAK
# ==========================================

try:

    while True:

        # Recebe os dados enviados pela ESP32
        linha = esp32.readline().decode(
            "utf-8",
            errors="ignore"
        ).strip()

        # Esperamos receber:
        # temperatura,umidade
        if "," not in linha:
            continue

        try:

            temperatura, umidade = linha.split(
                ",",
                1
            )

            temperatura = float(temperatura)
            umidade = float(umidade)


            # ==================================
            # MONTA A MENSAGEM DO THINGSPEAK
            # ==================================

            mensagem = (
                f"field1={temperatura:.2f}"
                f"&field2={umidade:.2f}"
            )


            # ==================================
            # VERIFICA A CONEXÃO MQTT
            # ==================================

            if not client.is_connected():

                reconectar_mqtt()


            # ==================================
            # PUBLICAÇÃO MQTT
            # ==================================

            resultado = client.publish(
                TOPICO,
                mensagem
            )

            try:

                resultado.wait_for_publish(
                    timeout=10
                )

                print(
                    f"Publicado -> "
                    f"Temperatura: "
                    f"{temperatura:.2f} °C | "
                    f"Umidade: "
                    f"{umidade:.2f} %"
                )

            except RuntimeError:

                print(
                    "Falha na publicação MQTT. "
                    "Tentando restabelecer "
                    "a conexão..."
                )

                reconectar_mqtt()


            # ==================================
            # INTERVALO ENTRE PUBLICAÇÕES
            # ==================================

            # Mantemos 16 segundos entre os
            # envios para o ThingSpeak.

            time.sleep(16)


        except ValueError:

            print(
                "Leitura inválida:",
                linha
            )


# ==========================================
# ENCERRAMENTO PELO USUÁRIO
# ==========================================

except KeyboardInterrupt:

    print(
        "\nPrograma encerrado pelo usuário."
    )


# ==========================================
# FINALIZAÇÃO
# ==========================================

finally:

    if esp32.is_open:
        esp32.close()

    client.loop_stop()

    try:
        client.disconnect()

    except Exception:
        pass

    print("Conexões encerradas.")