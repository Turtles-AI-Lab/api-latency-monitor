# ⚡ API Latency Monitor

Real-time response time comparison for LLM API providers. Monitor OpenAI, Anthropic, Google AI, Azure, Cohere, and Hugging Face APIs with beautiful visualizations and detailed statistics.

## 🎯 Features

- **Real-time Monitoring**: Track API response times across multiple providers simultaneously
- **Three Test Modes**:
  - 🎯 **Ping Test**: Quick endpoint reachability check (no API key required)
  - 📝 **Simple Request**: Minimal API request simulation
  - 🔐 **Full Request**: Complete authenticated API calls (requires keys)
- **Visual Charts**: Line charts showing latency history over time
- **Detailed Statistics**: Min, max, average, success rates, and more
- **Flexible Intervals**: Test every 5 seconds to 1 minute, or manual testing
- **Zero Dependencies**: Pure JavaScript, HTML, and CSS - no frameworks
- **Privacy First**: All tests run in your browser, no data sent to external servers
- **Open Source**: MIT licensed, inspect and modify as needed

## 🚀 Quick Start

1. **Clone or Download**:
   ```bash
   git clone https://github.com/Turtles-AI-Lab/api-latency-monitor.git
   cd api-latency-monitor
   ```

2. **Open in Browser**:
   ```bash
   # Just open index.html in any modern browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

3. **Start Monitoring**:
   - Select test mode (Ping recommended for quick checks)
   - Choose test interval
   - Click "Start Monitoring"
   - Watch the magic happen!

## 📊 Monitored Providers

- **OpenAI** - GPT models
- **Anthropic** - Claude models
- **Google AI** - Gemini models
- **Azure OpenAI** - Microsoft-hosted OpenAI
- **Cohere** - Command models
- **Hugging Face** - Inference API

## 🎮 Usage

### Ping Test Mode (Recommended)
No API keys required. Simply checks if endpoints are reachable.

```javascript
// Tests are conducted via browser fetch with no-cors mode
// Perfect for uptime monitoring
```

### Simple Request Mode
Simulates basic API requests. Currently uses ping test as fallback.

### Full Request Mode
Requires API keys for authenticated requests. Store keys locally in browser.

## 📈 Understanding the Data

- **Current**: Latest recorded latency
- **Average**: Mean latency across all successful tests
- **Min/Max**: Fastest and slowest response times
- **Success Rate**: Percentage of successful requests
- **Fast**: < 200ms
- **Normal**: 200-500ms
- **Slow**: > 500ms

## 🔒 Privacy & Security

✅ All tests run locally in your browser
✅ No data sent to external servers
✅ API keys stored in browser localStorage only
✅ No tracking, analytics, or cookies
✅ Open source - verify yourself

## 🛠️ Technical Details

**Built With**:
- Pure JavaScript (ES6+)
- HTML5 Canvas for charts
- CSS3 for styling
- No external dependencies

**Browser Support**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES6 support

## 📁 Project Structure

```
api-latency-monitor/
├── index.html          # Main HTML structure
├── css/
│   └── style.css       # All styling
├── js/
│   ├── providers.js    # API provider configurations
│   ├── monitor.js      # Core monitoring logic
│   ├── chart.js        # Chart visualization
│   └── app.js          # Main application logic
├── README.md
├── LICENSE
└── .gitignore
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first.

**Ideas for contributions**:
- Add more API providers
- Implement authenticated request modes
- Add export functionality (CSV, JSON)
- Dark mode support
- Mobile app version
- Historical data persistence

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🐢 About

Built by [Turtles AI Lab](https://github.com/Turtles-AI-Lab) - Free tools for AI developers

## 🔗 Related Tools

- [LLM Cost Calculator](https://github.com/Turtles-AI-Lab/llm-cost-calculator) - Compare AI API costs
- [Prompt Template Library](https://github.com/Turtles-AI-Lab/prompt-template-library) - Battle-tested AI prompts
- [Email-to-Ticket Parser](https://github.com/Turtles-AI-Lab/email-to-ticket-parser) - Extract ticket info from emails

## 📧 Contact

Questions or feedback? Email: jgreenia@jandraisolutions.com

---

⭐ **Star this repo** if you find it useful!
