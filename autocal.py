import pyautogui
import time

def buka_whatsapp():
    try:
        # Cek apakah wa.png ditemukan
        imagewa = pyautogui.locateOnScreen('wa.png')
        # Jika wa.png ditemukan, lakukan klik
        pyautogui.click(imagewa)
        
    except pyautogui.ImageNotFoundException:
        # Jika wa.png tidak ditemukan, gunakan wa2.png
        imagewa2 = pyautogui.locateOnScreen('wa2.png')
        # Jika wa2.png ditemukan, lakukan klik
        if imagewa2 is not None:
            pyautogui.click(imagewa2)

    time.sleep(5)
    pyautogui.click(252,174,clicks=2)
    time.sleep(3)
    image = pyautogui.locateCenterOnScreen('call.png')
    pyautogui.click(image)

buka_whatsapp()
