import os
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image

url = "https://daekyoace.com"
logo_path = r"C:\Users\User\.gemini\antigravity\brain\a844dc4b-4a75-4e6e-b783-06df04ea8621\media__1774567546639.png"
output_path = r"C:\Users\User\.gemini\antigravity\brain\a844dc4b-4a75-4e6e-b783-06df04ea8621\daekyoace_qr_new.png"

qr = qrcode.QRCode(
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=15,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

try:
    logo = Image.open(logo_path).convert("RGBA")
    # 흰색 배경에 투명도 덮어씌움
    white_bg = Image.new("RGBA", logo.size, "WHITE")
    white_bg.paste(logo, (0, 0), logo)
    white_bg = white_bg.convert("RGB")
    temp_logo_path = r"temp_logo_qr2.jpg"
    white_bg.save(temp_logo_path)
    
    # 짙은 초록빛이 감도는 색상과 둥근 모서리를 가진 QR
    img = qr.make_image(
        image_factory=StyledPilImage,
        embeded_image_path=temp_logo_path,
        module_drawer=RoundedModuleDrawer(radius_ratio=0.8),
        color_mask=SolidFillColorMask(front_color=(15, 60, 35), back_color=(255, 255, 255))
    )
    
    img.save(output_path)
    
    if os.path.exists(temp_logo_path):
        os.remove(temp_logo_path)
        
    print("QR Code generated successfully!")
except Exception as e:
    print("Error generating QR code:", e)
