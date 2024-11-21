# RealEyes.ai Chrome Extension

A Chrome extension that adds an overlay icon on images across various social media platforms to analyze them for potential deepfake manipulation.

## Features

- Image analysis for deepfake detection
- Support for major social media platforms:
  - LinkedIn
  - Facebook
  - Twitter/X
  - Instagram
  - Reddit
- Real-time probability scoring
- User-friendly interface
- Dark mode support
- Privacy-focused consent management

## Installation

1. Clone this repository

```bash
git clone https://github.com/slonweiss/realeyes-ai-extension.git
```

2. Install dependencies

```bash
npm install
```

3. Build the extension

```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## Development

### Scripts

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm run clean` - Clean dist directory
- `npm run rebuild` - Clean and rebuild

### Project Structure

- `/src` - Source code
- `/public` - Static assets
- `/dist` - Build output
- `/icons` - Extension icons

### Technologies Used

- Chrome Extension Manifest V3
- Webpack
- AWS Services (SageMaker, S3, DynamoDB)
- Jose JWT
- Sharp Image Processing

## Privacy & Security

The extension implements:

- User consent management
- Secure image processing
- Privacy-focused data handling
- Content security policies
- Cross-origin resource sharing (CORS) protection

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository.
