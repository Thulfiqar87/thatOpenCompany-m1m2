from PIL import Image
import collections

img = Image.open('src/assets/appLogo.png')
img = img.convert('RGBA')

# Resize for faster processing
img.thumbnail((100, 100))
pixels = img.getdata()

color_counts = collections.Counter()
for r, g, b, a in pixels:
    if a > 50: # ignore mostly transparent
        # ignore near white or near black or near gray if we want the actual brand color
        if max(r,g,b) - min(r,g,b) > 20 and min(r,g,b) < 220 and max(r,g,b) > 30:
            color_counts[(r,g,b)] += a

for color, count in color_counts.most_common(5):
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    print(f"Color: {color} -> {hex_color} (Score: {count})")
