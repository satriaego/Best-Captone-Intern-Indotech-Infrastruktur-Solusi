#include <SPI.h>
#include <LoRa.h>
#include "DHT.h"
#define lampu 32
#define DHTPIN 33
#define DHTTYPE DHT11
#include <PZEM004Tv30.h>
#define relay1 25
#define relay2 15
#define relay3 27
#define relay4 26
String LoRaData;
#if defined(ESP32)
PZEM004Tv30 pzem(Serial2, 16, 17);
#else
PZEM004Tv30 pzem(Serial2);
#endif

float voltage = 0;
float current = 0;
float power = 0;
float h = 0;
float t = 0;
// float f = dht.readTemperature(true);
bool lampuMenyala = false;
unsigned long lampuMulaiWaktu = 0;
const unsigned long lampuDurasi = 1000;

String lastLoRaData = ""; // Menyimpan status terakhir dari data LoRa
int lastRSSI = 0; 

const int ss = 5;           // LoRa radio chip select
const int rst = 14;         // LoRa radio reset
const int dio0 = 2;         // change for your board; must be a hardware interrupt pin


String outgoing;            // outgoing message
byte msgCount = 0;          // count of outgoing messages
byte localAddress = 0xBB;   // address of this device
byte destination = 0xFF;    // destination to send to
long lastSendTime = 0;      // last send time
int interval = 5000;        // interval between sends

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  pinMode(lampu, OUTPUT);
  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);

  Serial.begin(300);          
  while (!Serial);

  Serial.println("LoRa Duplex");


  LoRa.setPins(ss, rst, dio0);     // set CS, reset, IRQ pin

  if (!LoRa.begin(433E6)) {        // initialize ratio at 433 MHz
    Serial.println("LoRa init failed. Check your connections.");
    while (true);                
  }

  Serial.println("LoRa init succeeded.");
  dht.begin();
}

void loop() {
  bacadata();
  onReceive(LoRa.parsePacket());
  lampukedip();
  if (millis() - lastSendTime > interval) {
    String message = String(h);
    String message1 = String(t); 
    // String message2 = String(f);
    String message2 = String(voltage);
    String message3 = String(current);
    String message4 = String(power);
    sendMessage(message + "," + message1+ "," +message2+ "," +message3+ "," +message4); // concatenation of both messages
    //Serial.println("Sending " + message);
    Serial.println("Sending " + message + "," + message1+ "," +message2+ "," +message3+ "," +message4);

    lastSendTime = millis();            // timestamp the message

  }
      if (LoRaData == "1000") {
      digitalWrite(relay1, HIGH); // Mengaktifkan rl1
    } else if (LoRaData == "0100") {
      digitalWrite(relay2, HIGH); // Mengaktifkan rl2
    } else if (LoRaData == "0010") {
      digitalWrite(relay3, HIGH); // Mengaktifkan rl3
    } else if (LoRaData == "0001") {
      digitalWrite(relay4, HIGH); // Mengaktifkan rl4
    } else if (LoRaData == "0000") {
      digitalWrite(relay1, 0); // Mematikan semua pin
      digitalWrite(relay2, 0);
      digitalWrite(relay3, 0);
      digitalWrite(relay4, 0);
    }

  // parse for a packet, and call onReceive with the result:

}

void sendMessage(String outgoing) {
  LoRa.beginPacket();                   // start packet
  LoRa.write(destination);              // add destination address
  LoRa.write(localAddress);             // add sender address
  LoRa.write(msgCount);                 // add message ID
  LoRa.write(outgoing.length());        // add payload length
  LoRa.print(outgoing);                 // add payload
  LoRa.endPacket();                     // finish packet and send it
  msgCount++;                           // increment message ID
}

void onReceive(int packetSize) {
  if (packetSize == 0) return;          // if there's no packet, return

  // read packet header bytes:
  int recipient = LoRa.read();          // recipient address
  byte sender = LoRa.read();            // sender address
  byte incomingMsgId = LoRa.read();     // incoming msg ID
  byte incomingLength = LoRa.read();    // incoming msg length

  String incoming = "";

while (LoRa.available()) {
    LoRaData = LoRa.readString();
    Serial.println("Message: " + LoRaData);
    if (LoRaData == "1000") {
      digitalWrite(relay1, HIGH); // Mengaktifkan rl1
    // } else if (LoRaData == "0100") {
    //   digitalWrite(relay2, HIGH); // Mengaktifkan rl2
    // } else if (LoRaData == "0010") {
    //   digitalWrite(relay3, HIGH); // Mengaktifkan rl3
    // } else if (LoRaData == "0001") {
    //   digitalWrite(relay4, HIGH); // Mengaktifkan rl4
    } else if (LoRaData == "0000") {
      digitalWrite(relay1, 0); // Mematikan semua pin
      // digitalWrite(relay2, 0);
      // digitalWrite(relay3, 0);
      // digitalWrite(relay4, 0);
    }
    
    lastLoRaData = LoRaData; // Update lastLoRaData
    //incoming += (char)LoRa.read();
    digitalWrite(lampu, HIGH);
    lampuMenyala = true;
    lampuMulaiWaktu = millis();
  }


}


// }
void lampukedip() {
  if (lampuMenyala && millis() - lampuMulaiWaktu >= lampuDurasi) {
    // Matikan lampu jika durasi telah tercapai
    digitalWrite(lampu, LOW);
    // Serial.print("lampu kedip");
    lampuMenyala = false;
  }

}
void bacadata() {
  h = dht.readHumidity();
  t = dht.readTemperature();
  // float f = dht.readTemperature(true);
// Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t)) {
    h = 0;
    t = 0;
  }
  voltage = pzem.voltage();
  current = pzem.current();
  power = pzem.power();
  if(isnan(voltage)){
    voltage = 0;
    current = 0;
    power = 0;
  }
}