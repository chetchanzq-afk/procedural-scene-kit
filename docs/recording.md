# Recording the demo reel

`assets/kit/demo.html` plays a fixed 25-second camera timeline that switches themes
in place. It is built for screen recording: no HUD, no mouse, fade in/out, and a
lower-third caption that changes per shot.

## Shot list

| Time | Theme | What it shows |
|---|---|---|
| 0 – 7 s | `neon-rain` | Push toward the yard at night, wet-ground reflections |
| 7 – 13 s | `port-day` | **Same camera, only the lighting changes** |
| 13 – 19.5 s | `neon-rain` | Low angle between container rows, rain |
| 19.5 – 25.5 s | `port-day` | Pull back to a wide shot |

## URL parameters

| Param | Effect |
|---|---|
| `?q=high` | Render quality (default `medium`). Use `high` for recording. |
| `?loop` | Restart automatically, so you can record take after take. |
| `?clean` | Hide the caption and the triangle counter. |
| `?t=12` | Freeze at a given second — useful for a still or a poster frame. |
| `?start=2` | Jump to shot 3 and play from there. |

## Record

1. Serve the folder and open the reel at 1080p:

   ```bash
   cd assets/kit
   python -m http.server 8877
   # http://127.0.0.1:8877/demo.html?q=high&loop
   ```

2. Press `F11` for fullscreen. Let it play one full loop first — the first pass pays
   the shader-compile and texture-upload cost, later passes are smooth.
3. Record with OBS (Display Capture, 1920×1080, 60 fps) or `Win + Alt + R`.
   Turn the cursor off.
4. Stop after the fade to black. Press `Space` to restart while still recording if
   you want another take in the same file.

## Export

```bash
# 1080p, small file, plays everywhere
ffmpeg -i take.mkv -vf "scale=1920:-2" -c:v libx264 -crf 20 -pix_fmt yuv420p reel.mp4

# 720p GIF for X / chat / README, keep it under ~8 MB
ffmpeg -i reel.mp4 -vf "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" reel.gif
```

Aim for 15–30 s and a file under 10 MB. Anything longer does not get watched.

## Use it

- Put `reel.mp4` next to the hero image in the README (GitHub renders `<video>` from
  a repository path only via a raw link — a GIF is the safer first screen).
- Post the GIF or a native upload on X, Reddit (`r/threejs`, `r/webgl`,
  `r/proceduralgeneration`) and the three.js forum Showcase thread.
- Lead with the concrete claim, not the adjective: *"same layout, four lighting
  setups, zero asset files"*.

## Making a new reel

Edit the `SHOTS` array at the top of `src/demo.js`. Each entry is
`{ t, theme, title, from: { pos, look }, to: { pos, look } }` — the camera
interpolates from `from` to `to` until the next entry starts. Theme changes rebuild
the level (colours are baked into vertex colours), so keep consecutive shots on the
same theme when you want an uninterrupted camera move.
