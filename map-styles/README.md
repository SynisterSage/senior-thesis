# TrailMark map moods

These are Mapbox Standard starter styles for the story player. Import a JSON file into Mapbox Studio, preview it around Yellowstone, then publish it. Studio will give the style its own production URL for the app.

## Included moods

- `trailmark-field-guide.json` — quiet daylight terrain for the default story.
- `trailmark-golden-hour.json` — warm dusk replay for a more cinematic story.
- `trailmark-blue-hour-3d.json` — deep blue dusk palette with 3D buildings and terrain-friendly detail.

The route, moment pins, and TrailMark interaction layers stay in the app. These files define only the basemap mood.

## Use in Studio

1. In Mapbox Studio, create a new style from **Mapbox Standard**.
2. Use the style's options menu to upload/replace its JSON with one of these files, or reproduce the import settings in Studio's basemap panel.
3. Preview at Grand Prismatic Overlook and make any final color adjustments.
4. Publish and copy its production URL (`mapbox://styles/<your-username>/<style-id>`).

Use a production URL in the app, not the `/draft` URL. The draft URL is intentionally rate-limited.
