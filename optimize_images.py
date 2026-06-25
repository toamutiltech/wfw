import os
from PIL import Image

folder = 'assets/images'
for filename in os.listdir(folder):
    if filename.endswith('.png'):
        filepath = os.path.join(folder, filename)
        try:
            img = Image.open(filepath)
            # If image is very large, we can resize it, but 1024x1024 is fine for Expo.
            # We just optimize it to reduce file size.
            img.save(filepath, "PNG", optimize=True)
            print(f"Optimized {filename}")
        except Exception as e:
            print(f"Error optimizing {filename}: {e}")
