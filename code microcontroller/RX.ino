#include <SPI.h>
#include <LoRa.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <PubSubClient.h>
#define MAX_MESSAGE_LENGTH 5

String incomingMessage = "0000";
const int ss = 5;
const int rst = 14;
const int dio0 = 2;
int buttonState; 
int currentData = 0;

#define satria_humi "satria/humi" 
#define satria_suhuc "satria/suhuc"
#define satria_v "satria/v"
#define satria_i "satria/i"
#define satria_w "satria/w"
#define satria_rssi "satria/rssi" 


// const char* ssid = "hitam";
// const char* password = "hitammmm";
// const char* ssid = "Agus";
// const char* password = "ponorogo2112";
const char* ssid = "Wardana";
const char* password = "1sampai8";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;

int latestRssiValue;
String messages[5]; // Array untuk menyimpan pesan-pesan terpisah


unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50; 

int lastButtonState = LOW;


bool lampuMenyala = false;
unsigned long lampuMulaiWaktu = 0;
const unsigned long lampuDurasi = 1000; // Durasi lampu menyala dalam milidetik

#define skakel 33

// bool lastButtonState = false;
bool messageChanged = false;
// String message = "1";

// #define buzzerPin 4
#define lampu 32


int lcdColumns = 16;
int lcdRows = 2;

LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);

byte gajah[8] = {
  0b00100,
  0b01010,
  0b00100,
  0b00000,
  0b00000,
  0b00000,
  0b00000,
  0b00000
};

String outgoing;
byte msgCount = 0;
byte localAddress = 0xBB;
byte destination = 0xFF;
long lastSendTime = 0;
int interval = 2000;

void setup_wifi() { //perintah koneksi wifi
  delay(10);
  // mulai konek ke wifi
  Serial.println();
  Serial.print("Terhubung ke .. ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA); //setting wifi chip sebagai station/client
  WiFi.begin(ssid, password); //koneksi ke jaringan wifi

  while (WiFi.status() != WL_CONNECTED) { //perintah tunggu esp32 sampi terkoneksi ke wifi
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi terhubung");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}
void reconnect() { 
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // perintah membuat client id unik agar broker menerima
    String clientId = "satria";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("Terhubung ke broker ..");
      client.subscribe("satria/pesan");

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
void setup() {
  pinMode(skakel, INPUT_PULLUP);
  Serial.begin(300);
  while (!Serial);

  Serial.println("LoRa Duplex");

  LoRa.setPins(ss, rst, dio0);

  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa init failed. Check your connections.");
    while (true);
  }

  Serial.println("LoRa init succeeded.");

  lcd.init();
  lcd.backlight();
  lcd.createChar(1, gajah);
  pinMode(lampu, OUTPUT);
  
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}


void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  onReceivedata1(LoRa.parsePacket());
  lampukedip();

  if (millis() - lastSendTime > interval) {
    sendMessage(incomingMessage);
    Serial.println("Sending: " + incomingMessage);
    lastSendTime = millis();
  }
int reading = digitalRead(skakel);
  if (reading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;
      if (buttonState == HIGH) {
        currentData++; 
        if (currentData > 2) {
          currentData = 1; // Kembali ke data awal jika sudah mencapai data terakhir
        }

        lcd.clear(); // Bersihkan layar LCD
        if (currentData == 1) {
          lcd.setCursor(0, 0);
          lcd.print(String(messages[0]));
          lcd.setCursor(7, 0);
          lcd.print("%");
          lcd.setCursor(0, 1);
          lcd.print(String(messages[1]));
          lcd.setCursor(6, 1);
          lcd.write(byte(1));
          lcd.setCursor(7, 1);
          lcd.print("C");
          lcd.setCursor(9, 0);
          lcd.print("/SATRIA/");
          lcd.setCursor(9, 1);
          lcd.print("RS: "+ String(latestRssiValue));
        } else if (currentData == 2) {
          lcd.setCursor(0, 0);
          lcd.print(String(messages[2]));
          lcd.setCursor(7, 0);
          lcd.print("V");
          lcd.setCursor(0, 1);
          lcd.print(String(messages[3]));
          lcd.setCursor(7, 1);
          lcd.print("A");
          lcd.setCursor(9, 0);
          lcd.print(String(messages[4]));
          lcd.setCursor(9, 1);
          lcd.print("RS: "+ String(latestRssiValue));
        } 
        // else if (currentData == 3) {
        //   lcd.setCursor(0, 0);
        //   lcd.print("Data 3");
        // }
      }
    }
  }

  lastButtonState = reading;
  //publish 
  unsigned long now = millis();
  if (now - lastMsg > 5000) { //perintah publish data tiap 5 detik
    lastMsg = now;
    String lembab = String(messages[0]);
    client.publish(satria_humi, lembab.c_str());

    String tempc = String(messages[1]); //membuat variabel hum untuk di publish ke broker mqtt
    client.publish(satria_suhuc, tempc.c_str());

    String v = String(messages[2]); // Menggabungkan dua nilai menjadi satu string
    client.publish("satria/v", v.c_str());

    String i = String(messages[3]); // Menggabungkan dua nilai menjadi satu string
    client.publish("satria/i", i.c_str());

    String w = String(messages[4]); // Menggabungkan dua nilai menjadi satu string
    client.publish("satria/w", w.c_str());

    String rssii = String(latestRssiValue); //membuat variabel hum untuk di publish ke broker mqtt
    client.publish(satria_rssi, rssii.c_str());
    

  }



}


void sendMessage(String outgoing) {
  LoRa.beginPacket();
  LoRa.write(destination);
  LoRa.write(localAddress);
  LoRa.write(msgCount);
  LoRa.write(outgoing.length());
  LoRa.print(outgoing);
  LoRa.endPacket();
  msgCount++;
}

void onReceivedata1(int packetSize) {

  if (packetSize == 0) return;

  int recipient = LoRa.read();
  byte sender = LoRa.read();
  byte incomingMsgId = LoRa.read();
  byte incomingLength = LoRa.read();

  String incoming = "";
  while (LoRa.available()) {
  String LoRaData = LoRa.readString(); // Membaca string lengkap dari LoRa

  // Pisahkan pesan berdasarkan koma
  int comma1 = LoRaData.indexOf(',');
  messages[0] = LoRaData.substring(0, comma1); // Baca pesan pertama

  int comma2 = LoRaData.indexOf(',', comma1 + 1);
  messages[1] = LoRaData.substring(comma1 + 1, comma2); // Baca pesan kedua

  int comma3 = LoRaData.indexOf(',', comma2 + 1);
  messages[2] = LoRaData.substring(comma2 + 1, comma3); // Baca pesan ketiga

  int comma4 = LoRaData.indexOf(',', comma3 + 1);
  messages[3] = LoRaData.substring(comma3 + 1, comma4); // Baca pesan keempat

  messages[4] = LoRaData.substring(comma4 + 1); // Baca pesan kelima

  // Serial.println(messages[0]); // h
  // Serial.println(messages[1]); //c
  // Serial.println(messages[2]); //teganga
  // Serial.println(messages[3]); //arus
  // Serial.println(messages[4]); //daya
  int rssiValue = LoRa.packetRssi();
  latestRssiValue = rssiValue;
  // Serial.print(latestRssiValue);

  // Perbarui tampilan LCD sesuai dengan data yang diterima
  lcd.clear();
  if (currentData == 1) {
    lcd.setCursor(0, 0);
    lcd.print(String(messages[0]));
    // lcd.setCursor(6, 0);
    // lcd.write(byte(1));
    lcd.setCursor(7, 0);
    lcd.print("%");
    lcd.setCursor(0, 1);
    lcd.print(String(messages[1]));
    lcd.setCursor(6, 1);
    lcd.write(byte(1));
    lcd.setCursor(7, 1);
    lcd.print("C");
    lcd.setCursor(9, 0);
    lcd.print("/SATRIA/");
    lcd.setCursor(9, 1);
    lcd.print("RS:" + String(latestRssiValue));
  } else if (currentData == 2) {
      lcd.setCursor(0, 0);
      lcd.print(String(messages[2]));
      // lcd.setCursor(6, 0);
      // lcd.write(byte(1));
      lcd.setCursor(7, 0);
      lcd.print("V");
      lcd.setCursor(0, 1);
      lcd.print(String(messages[3]));
      // lcd.setCursor(6, 1);
      // lcd.write(byte(1));
      lcd.setCursor(7, 1);
      lcd.print("A");
      lcd.setCursor(9, 0);
      lcd.print(String(messages[4]));
      lcd.setCursor(15, 0);
      lcd.print("W");
      lcd.setCursor(9, 1);
      lcd.print("RS: "+ String(latestRssiValue));
  } 
  // else if (currentData == 3) {
  //   lcd.setCursor(0, 0);
  //   lcd.print("Data 3");
  // }
    
    

    // lcd.setCursor(0, 0);
    // lcd.print(String(temperatureC));
    // lcd.setCursor(6, 0);
    // lcd.write(byte(1));
    // lcd.setCursor(7, 0);
    // lcd.print("C");
    // lcd.setCursor(0, 1);
    // lcd.print(String(temperatureF));
    // lcd.setCursor(6, 1);
    // lcd.write(byte(1));
    // lcd.setCursor(7, 1);
    // lcd.print("F");
    // lcd.setCursor(9, 0);
    // lcd.print("/SATRIA/");
    // rssiValue = LoRa.packetRssi();
    // lcd.setCursor(9, 1);
    // lcd.print("RS:"+ String(rssiValue));
  
  digitalWrite(lampu, HIGH);
  lampuMenyala = true;
  lampuMulaiWaktu = millis();
  
  // Serial.println("RSSI: " + String(LoRa.packetRssi()));
  }

  if (recipient != localAddress && recipient != 0xFF) {
    Serial.println("This message is not for me.");
    return;
  }



}
void lampukedip() {
  if (lampuMenyala && millis() - lampuMulaiWaktu >= lampuDurasi) {
    // Matikan lampu jika durasi telah tercapai
    digitalWrite(lampu, LOW);
    // Serial.print("lampu kedip");
    lampuMenyala = false;
  }

}

void callback(char* topic, byte* payload, unsigned int length) {
  incomingMessage = "";
  // Serial.print("Message arrived [");
  // Serial.print(topic);
  // Serial.print("] ");

  // Tindakan yang sesuai berdasarkan topik
  if (strcmp(topic, "satria/pesan") == 0) {
    // Jika pesan dari topik pertama, lakukan sesuatu...
    for (int i = 0; i < length; i++) {
    incomingMessage += (char)payload[i]; // Tambahkan setiap karakter pesan ke variabel incomingMessage
  }

  // Di sini Anda dapat melakukan operasi lain yang diperlukan dengan pesan yang diterima
  Serial.print("Received message: ");
  Serial.println(incomingMessage);

  }
}