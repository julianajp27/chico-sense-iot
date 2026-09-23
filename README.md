# 🌱 Chico Sense – Projeto IoT

Projeto desenvolvido para monitoramento de temperatura e umidade utilizando o sensor DHT11 e a placa ESP32-C3 SuperMini.

O sistema realiza a leitura dos dados ambientais e envia as informações para a plataforma ThingSpeak utilizando comunicação MQTT.

---

## 📌 Objetivo

O Chico Sense faz parte do Projeto Integrador voltado à aplicação de tecnologia no contexto da fruticultura do Vale do São Francisco.

Nesta etapa do projeto, foi desenvolvida uma solução IoT capaz de:

- coletar temperatura;
- coletar umidade;
- realizar a leitura dos sensores através da ESP32-C3;
- transmitir os dados para o computador;
- utilizar Python para processar os dados;
- utilizar o protocolo MQTT para comunicação;
- enviar os dados para o ThingSpeak;
- visualizar as informações através de gráficos.

---

## 🏗️ Arquitetura da solução

A comunicação utilizada no protótipo segue este fluxo:

```text
┌──────────────┐
│    DHT11     │
│              │
│ Temperatura  │
│   Umidade    │
└──────┬───────┘
       │
       │ leitura do sensor
       ▼
┌──────────────────────┐
│ ESP32-C3 SuperMini   │
│                      │
│ Leitura do DHT11     │
│ GPIO 4               │
└──────────┬───────────┘
           │
           │ USB / Comunicação Serial
           │ 115200 baud
           ▼
┌──────────────────────┐
│      Computador      │
│                      │
│       Python         │
│     + PySerial       │
└──────────┬───────────┘
           │
           │ MQTT
           │ Porta 1883
           ▼
┌──────────────────────┐
│      ThingSpeak      │
│                      │
│ Field 1: Temperatura │
│ Field 2: Umidade     │
└──────────┬───────────┘
           │
           ▼
      📊 Dashboard
```

### Fluxo simplificado

**DHT11 → ESP32-C3 → USB/Serial → Python → MQTT → ThingSpeak → Dashboard**

---

## 🔌 Componentes utilizados

- ESP32-C3 SuperMini
- Sensor DHT11
- Protoboard
- Jumpers
- Cabo USB
- Computador
- Arduino IDE
- Python
- ThingSpeak

---

## 🌡️ Sensor DHT11

O DHT11 é responsável pela coleta das duas variáveis utilizadas nesta etapa:

| Dado | Utilização |
|---|---|
| Temperatura | Monitoramento da temperatura ambiente |
| Umidade | Monitoramento da umidade relativa do ar |

### Pinagem utilizada

O DHT11 possui quatro pinos:

| Pino | Função |
|---|---|
| 1 | VCC |
| 2 | DATA |
| 3 | NC – não utilizado |
| 4 | GND |

No protótipo, o pino DATA foi conectado ao **GPIO 4 da ESP32-C3**.

---

## 📡 Comunicação com a ESP32

Inicialmente, foram realizados testes para utilizar diretamente a comunicação Wi-Fi da ESP32-C3.

Durante os testes, a placa apresentou dificuldades para estabelecer de forma estável a conexão necessária.

Como alternativa para dar continuidade ao protótipo, foi utilizada a comunicação serial através do cabo USB.

Dessa forma, a ESP32 realiza a leitura do DHT11 e envia os valores para o computador no formato:

```text
temperatura,umidade
```

Exemplo:

```text
32.30,55.40
```

---

## 🐍 Ponte desenvolvida em Python

No computador, um programa em Python recebe os valores enviados pela ESP32 através da porta serial.

O fluxo realizado pelo programa é:

```text
ESP32
  ↓
Porta Serial (USB)
  ↓
PySerial
  ↓
Python
  ↓
Paho MQTT
  ↓
ThingSpeak
```

O programa separa os valores de temperatura e umidade e prepara a mensagem para publicação:

```text
field1=temperatura&field2=umidade
```

---

## ☁️ ThingSpeak

O ThingSpeak foi utilizado como plataforma de IoT para receber e visualizar os dados coletados.

Foram configurados dois campos:

- **Field 1:** Temperatura
- **Field 2:** Umidade

A comunicação é realizada através do protocolo MQTT.

Configuração utilizada:

```text
Servidor MQTT: mqtt3.thingspeak.com
Porta: 1883
```

O envio respeita um intervalo entre as atualizações antes de uma nova publicação.

---

## 🔐 Segurança das credenciais

As credenciais MQTT não são armazenadas diretamente no código Python.

Elas ficam em um arquivo:

```text
.env
```

Exemplo da estrutura:

```env
MQTT_CLIENT_ID=seu_client_id
MQTT_USERNAME=seu_username
MQTT_PASSWORD=sua_senha
```

O arquivo `.env` está incluído no `.gitignore` e, portanto, não deve ser enviado ao GitHub.

O repositório disponibiliza apenas:

```text
.env.example
```

Esse arquivo serve como modelo para configuração do projeto.

> ⚠️ Nunca publique Client ID, Username, Password ou outras credenciais reais no repositório.

---

## 📁 Estrutura do projeto

```text
chico-sense-iot/
│
├── esp32/
│   └── chico_sense.ino
│
├── python/
│   ├── teste_mqtt.py
│   └── teste_thingspeak.py
│
├── imagens/
│   ├── montagem.jpg
│   ├── dht11.png
│   ├── arquitetura.png
│   └── thingspeak.png
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Bibliotecas Python

Para executar a aplicação, são utilizadas as bibliotecas:

```text
pyserial
paho-mqtt
python-dotenv
```

Instalação:

```bash
python -m pip install pyserial paho-mqtt python-dotenv
```

---

## ▶️ Como executar

### 1. Conectar a ESP32

Conecte a ESP32-C3 ao computador através do cabo USB.

### 2. Carregar o código da ESP32

Utilize o Arduino IDE para carregar:

```text
esp32/chico_sense.ino
```

### 3. Fechar o Monitor Serial

O Monitor Serial do Arduino IDE deve estar fechado para que o Python possa acessar a porta COM.

### 4. Configurar as credenciais

Crie o arquivo `.env` utilizando `.env.example` como modelo.

### 5. Executar o programa

Na raiz do projeto:

```bash
python python/teste_thingspeak.py
```

Quando estiver funcionando corretamente, o terminal apresentará as leituras de temperatura e umidade publicadas no ThingSpeak.

---

## 🧪 Testes realizados

Durante o desenvolvimento foram realizados testes de:

- leitura do DHT11;
- comunicação serial da ESP32;
- identificação da porta COM;
- conectividade com o servidor MQTT;
- autenticação MQTT;
- publicação no ThingSpeak;
- atualização dos gráficos de temperatura e umidade.

Também foi criado o arquivo:

```text
python/teste_mqtt.py
```

para auxiliar na verificação da autenticação MQTT.

---

## 📊 Resultado

O protótipo conseguiu realizar o fluxo completo:

```text
Coleta
   ↓
DHT11
   ↓
ESP32-C3
   ↓
USB / Serial
   ↓
Python
   ↓
MQTT
   ↓
ThingSpeak
   ↓
Visualização dos dados
```

As leituras de temperatura e umidade foram recebidas pelo ThingSpeak e apresentadas nos respectivos gráficos.

---

## 🚀 Próximas etapas

O protótipo poderá ser evoluído com:

- novos sensores;
- monitoramento de outras variáveis;
- melhorias na comunicação;
- integração com o dashboard do Projeto Integrador;
- armazenamento e análise histórica dos dados;
- integração com as demais áreas do projeto.

---

## 🎓 Contexto acadêmico

Projeto desenvolvido como parte das atividades de **Internet das Coisas (IoT)** do curso de **Análise e Desenvolvimento de Sistemas**.

O Chico Sense integra a camada de coleta de dados do Projeto Integrador **Inteligência de Dados no Vale do São Francisco**, relacionado ao monitoramento de condições relevantes para a produção e logística de frutas, como uvas e mangas.