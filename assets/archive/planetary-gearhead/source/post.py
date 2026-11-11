"""Subtle vignette + JPEG export. usage: post.py in.png out.jpg [strength]"""
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 0.10
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255.0
h, w, _ = im.shape
y, x = np.mgrid[0:h, 0:w]
r2 = ((x - w / 2) / (w / 2)) ** 2 * 0.8 + ((y - h / 2) / (h / 2)) ** 2 * 0.8
v = 1.0 - k * np.clip(r2, 0, 2) ** 1.3
out = im * v[..., None]
out += (np.random.default_rng(0).random(out.shape) - 0.5) / 255.0  # dither
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst, quality=95, optimize=True, progressive=True, subsampling=0)
