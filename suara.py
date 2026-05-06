import os
import speech_recognition as sr
import subprocess

def convert_opus_to_wav(opus_file, wav_file):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "quiet", "-i", opus_file, wav_file])  # Tambahkan opsi -y untuk menimpa file tanpa konfirmasi

def recognize_speech_from_wav(wav_file):
    recognizer = sr.Recognizer()
    with sr.AudioFile(wav_file) as source:
        audio = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio, language='id-ID')
            return text
        except sr.WaitTimeoutError:
            return "Tidak ada suara yang terdeteksi."
        except sr.UnknownValueError:
            return "Tidak dapat mengenali suara."
        except sr.RequestError as e:
            return "Error pada saat memproses permintaan: " + str(e)

def recognize_speech():
    # Ganti dengan path ke file opus
    opus_file = "C:\\Users\\satria\\Desktop\\Fuyu\\database\\sound\\audio_temp.opus"  
    # Ganti dengan path untuk menyimpan file WAV yang dikonversi
    wav_file = "C:\\Users\\satria\\Desktop\\Fuyu\\database\\sound\\audio_temp.wav"  
    
    # Tambahkan path direktori ffmpeg ke PATH lingkungan Python
    ffmpeg_path = "C:\\Users\\satria\\Desktop\\Fuyu\\ffmpeg\\bin"
    os.environ['PATH'] += os.pathsep + ffmpeg_path
    
    convert_opus_to_wav(opus_file, wav_file)
    text = recognize_speech_from_wav(wav_file)
    print(text)  # Cetak output teks
    
if __name__ == "__main__":
    recognize_speech()
