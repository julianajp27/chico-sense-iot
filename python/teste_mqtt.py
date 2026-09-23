import os
import time
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

# Localiza o .env na raiz do projeto
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH)

CLIENT_ID = os.getenv("MQTT_CLIENT_ID")
USERNAME = os.getenv("MQTT_USERNAME")
PASSWORD = os.getenv("MQTT_PASSWORD")


def on_connect(client, userdata, flags, reason_code, properties):
    print("RESULTADO MQTT:", reason_code)


client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=CLIENT_ID
)

client.username_pw_set(USERNAME, PASSWORD)

client.on_connect = on_connect

print("Testando autenticação MQTT...")

client.connect(
    "mqtt3.thingspeak.com",
    1883,
    60
)

client.loop_start()

time.sleep(5)

print("Conectado:", client.is_connected())

client.loop_stop()
client.disconnect()