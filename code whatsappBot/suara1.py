from google.cloud import speech_v1
from google.cloud.speech_v1 import types


def transcribe_audio(audio_file_path):
    client = speech_v1.SpeechClient()

    with open(audio_file_path, "rb") as audio_file:
        content = audio_file.read()

    audio = {"content": content}
    config = {
        "language_code": "en-ID"
    }
    response = client.recognize(config=config, audio=audio)

    for result in response.results:
        print("Transcript: {}".format(result.alternatives[0].transcript))

# Panggil fungsi transkripsi dengan path file audio sebagai argumen
transcribe_audio("C:\\Users\\satria\\Desktop\\Fuyu\\database\\sound\\audio_temp.opus")
