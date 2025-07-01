# Price Scanner Backend Testing Guide

## 🎯 Overview
This guide helps you test the Price Scanner backend without needing the mobile frontend.

## ⚠️ Prerequisites

1. **OpenAI API Key**: Make sure you have a valid OpenAI API key configured in your `.env` file
2. **Dependencies**: Install required packages
3. **Server Running**: Backend server must be running on port 8000

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Create/update `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
NODE_ENV=development
```

### 3. Start the Server
```bash
npm start
```

You should see:
```
🚀 Price Scanner Backend running on port 8000
📱 Health check: http://localhost:8000/health
🔍 Scan endpoint: http://localhost:8000/api/scan
```

## 🧪 Testing Methods

### Method 1: Web Interface (Easiest)
1. **Open** `test-web-interface.html` in your browser
2. **Drag and drop** an image or click "Choose Image"
3. **Click** "🚀 Analyze Image"
4. **Wait** 10-30 seconds for results

### Method 2: Command Line Script
1. **Save** a test image in the `test-images` folder
2. **Run** the test script:
   ```bash
   node test-image-analysis.js ./test-images/your-image.jpg
   ```

### Method 3: Manual API Testing (Advanced)
Use tools like Postman or curl:
```bash
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: multipart/form-data" \
  -F "image=@./test-images/your-image.jpg"
```

## 📸 Test Images
Place test images in the `backend/test-images/` folder. Good test items include:
- Vintage t-shirts
- Sneakers
- Electronics
- Books
- Collectibles
- Clothing with visible brands/tags

## 📊 Expected Results
A successful analysis should return:
```json
{
  "analysis": {
    "item_identification": "Vintage Nike T-shirt",
    "price_range": "$25-45",
    "condition_assessment": "Good condition with minor wear",
    "selling_platforms": {
      "eBay": "$25-35",
      "Poshmark": "$30-45",
      "Facebook Marketplace": "$20-30"
    }
  },
  "confidence": "High",
  "timestamp": "2025-01-09T..."
}
```

## 🔧 Troubleshooting

### Server Won't Start
- Check if port 8000 is available
- Ensure all dependencies are installed: `npm install`
- Check for missing `.env` file

### OpenAI API Errors
- Verify your API key is valid and has credits
- Check the key in your `.env` file
- Ensure you have access to GPT-4 Vision API

### Image Upload Errors
- Ensure image is under 10MB
- Use supported formats: JPG, PNG, GIF, WebP
- Check file permissions

### Analysis Takes Too Long
- Normal response time: 10-30 seconds
- Check your internet connection
- Verify OpenAI API status

## 🎯 Testing Checklist

- [ ] Server starts without errors
- [ ] Health check endpoint responds: `http://localhost:8000/health`
- [ ] Can upload and preview images
- [ ] Analysis completes successfully
- [ ] Results include item identification
- [ ] Results include price estimates
- [ ] Results include condition assessment
- [ ] Multiple platforms are analyzed
- [ ] Confidence score is provided

## 📝 Sample Test Commands

```bash
# Test server health
curl http://localhost:8000/health

# Test with command line script
node test-image-analysis.js ./test-images/shirt.jpg

# Help with test commands
npm run test:help
```

## 🔍 Debugging Tips

1. **Check console logs** for detailed error messages
2. **Use web interface** for easier debugging
3. **Test with different image types** to isolate issues
4. **Verify API key** with a simple OpenAI test
5. **Check network connectivity** for API calls

## 📞 Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are met
3. Test with the web interface first
4. Review this testing guide

---

**Happy Testing!** 🎉 