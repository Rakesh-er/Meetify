# Performance Optimization

## Techniques
- Tailwind CSS with Purge enables tree-shaken styles
- Image optimization and responsive sizing
- Minimal DOM reflow via absolute positioned dropdowns
- Caching user data and history requests

## Metrics To Monitor
- First Contentful Paint (FCP)
- Time To Interactive (TTI)
- CLS for layout stability (dropdown uses absolute positioning)
- JS bundle size and code-splitting opportunities

## Recommendations
- Use lazy-loading for heavy routes (meeting UI)
- Preload critical fonts, defer non-critical assets
- Prefer vector icons over raster images