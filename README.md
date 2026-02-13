# CYBERSERIAL

A cyberpunk-themed UART serial communication visualizer. Visualize and analyze serial data transmission in real-time with glitchy aesthetics.

![CyberSerial](https://img.shields.io/badge/version-0.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## 🎯 Features

- **Real-time UART Visualization** - See TX/RX signals as they happen
- **Configurable Parameters** - Adjust baud rate, data bits, parity, stop bits
- **Auto & Manual Mode** - Generate random traffic or send specific data
- **Error Detection** - Visual indicators for parity, framing, and data mismatch errors
- **Speed Control** - Slow down simulation (0.001x, 0.01x, 1x) for detailed analysis
- **Interactive Controls** - Zoom, pan, reset graph view
- **Decoder Output** - See decoded ASCII data in real-time
- **Cyberpunk UI** - Glitchy animations, neon effects, scanline overlay

## 🚀 Live Demo

Check out the live deployment: [**https://abda-s.github.io/cyberserial/**](https://abda-s.github.io/cyberserial/)

## 🛠️ Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **uPlot** - High-performance time-series visualization
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and glitch effects
- **Web Workers** - Off-main-thread simulation processing

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/abda-s/cyberserial.git

# Navigate to project directory
cd cyberserial

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Building

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Built files will be in the `dist/` directory.

## 📖 Usage

### Basic Workflow

1. **Configure Transmitter**
   - Set baud rate (300 - 115200)
   - Configure parity (None, Even, Odd)
   - Set stop bits (1 or 2)
   - Adjust idle/guard bits between frames

2. **Configure Receiver**
   - Match TX settings or test with different baud rates
   - Parity and stop bits must match for successful decoding

3. **Send Data**
   - Enter text in the input field (default: "SOS")
   - Click "SEND" or press Enter
   - Enable "Auto-Generate Traffic" for continuous random data

4. **Analyze Signals**
   - Watch the waveform display for TX/RX signals
   - Monitor decoded output for errors
   - Use zoom controls to examine specific time periods
   - Adjust simulation speed for slow-motion analysis

### Speed Controls

- **1x** - Real-time simulation
- **0.01x** - Slow motion (100x slower)
- **0.001x** - Ultra slow (1000x slower) - default

### Graph Controls

- **Zoom In/Out** - Adjust time window
- **Pan Left/Right** - Move along timeline
- **RESET** - Return to default view
- **CLEAR ALL** - Clear graph history and decoder output

### Understanding the Display

- **Cyan line** - TX (transmit) signal
- **Colored dots** - Decoded bits:
  - 🟢 Green - Start bit
  - 🟡 Yellow - Data bits
  - 🔵 Blue - Parity bit
  - 🟣 Purple - Stop bit
  - 🔴 Red - Error (parity, framing, mismatch)
- **Bottom panel** - Decoded ASCII output

## 🏛️ Troubleshooting

### Build Errors

If you encounter build errors, ensure you have:
- Node.js 20 or higher
- npm installed and up to date

### Deployment Issues

The app uses GitHub Actions for automatic deployment. To fix 404 errors:

1. Go to repository → Settings → Pages
2. Set "Source" to "GitHub Actions"
3. Save and wait 1-2 minutes
4. Refresh the site URL

## 📝 Development

```bash
# Install dependencies
npm install

# Run type checking
npx tsc --noEmit

# Run linter
npm run lint
```

## 📄 Project Structure

```
cyberserial/
├── src/
│   ├── components/          # React components
│   │   ├── device/        # TX/RX panel components
│   │   ├── graph/         # Scope controls and status
│   │   └── layout/        # Layout components
│   ├── hooks/              # Custom React hooks
│   │   ├── useSimulation.ts # Simulation logic
│   │   └── useScopeGraph.ts # Graph handling
│   ├── utils/              # Utility functions
│   └── workers/            # Web Workers
│       └── simulation.worker.ts
├── public/                 # Static assets
└── dist/                  # Build output
```

## 🧪 Deployment

This project uses GitHub Actions for CI/CD. Merging to `main` branch triggers:

1. ✅ TypeScript compilation
2. ✅ Vite production build
3. ✅ Deploy to GitHub Pages

**Automatic deployment:** Enabled via `.github/workflows/deploy.yml`

## 📜 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI framework
- [uPlot](https://github.com/leeoniya/uPlot) - Charting library
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

Made with 💜 by [abda-s](https://github.com/abda-s)
