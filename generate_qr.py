import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from PIL import Image, ImageOps

url = "https://daekyoace.com"
logo_path = "images/logo.png"
output_path = "images/daekyoace_qr.png"

qr = qrcode.QRCode(
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=3,
)
qr.add_data(url)
qr.make(fit=True)

# Open logo and ensure it has a white background if it has transparency
logo = Image.open(logo_path).convert("RGBA")
white_bg = Image.new("RGBA", logo.size, "WHITE")
white_bg.paste(logo, (0, 0), logo)
white_bg = white_bg.convert("RGB")
temp_logo_path = "images/logo_temp_qr.jpg"
white_bg.save(temp_logo_path)

# Generate QR image with styled modules and embedded logo
img = qr.make_image(
    image_factory=StyledPilImage,
    embeded_image_path=temp_logo_path,
    module_drawer=RoundedModuleDrawer()
)

img.save(output_path)

# Cleanup temp logo
import os
if os.path.exists(temp_logo_path):
    os.remove(temp_logo_path)

print("QR Code generated successfully at", output_path)
