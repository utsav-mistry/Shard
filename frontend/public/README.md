# Public Assets

This directory contains the public assets for the Shard frontend application.

## Files

- `index.html`: The main HTML file that serves as the entry point for the React application
- `favicon.svg`: The favicon for the application
- `logo.svg`: The logo for the application
- `manifest.json`: Web app manifest for PWA support
- `robots.txt`: Instructions for web crawlers

## Usage

These files are automatically included in the build process. You can reference them in your code using the `%PUBLIC_URL%` placeholder.

Example:
```html
<link rel="icon" href="%PUBLIC_URL%/favicon.svg" />
```

For more information, see the [Create React App documentation](https://create-react-app.dev/docs/using-the-public-folder/).