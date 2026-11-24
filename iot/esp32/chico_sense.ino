#include <DHT.h>

// ==========================================
// CONFIGURAÇÃO DO SENSOR DHT11
// ==========================================
#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// ==========================================
// INICIALIZAÇÃO
// ==========================================
void setup() {

  Serial.begin(115200);

  delay(2000);

  dht.begin();
}

// ==========================================
// LEITURA DO SENSOR
// ==========================================
void loop() {

  float temperatura = dht.readTemperature();
  float umidade = dht.readHumidity();

  // Verifica se a leitura foi realizada corretamente
  if (!isnan(temperatura) && !isnan(umidade)) {

    // Formato utilizado pelo programa Python:
    // temperatura,umidade

    Serial.print(temperatura);
    Serial.print(",");
    Serial.println(umidade);
  }

  delay(2000);
}