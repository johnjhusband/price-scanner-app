# OpenAI Web Search API Update (2025)

## Current Capability
OpenAI now offers web search capabilities through their API! This is a game-changer for Flippi.ai.

## Available Options

### 1. Web Search Preview Tool
Add to existing GPT-4o requests:
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  tools: [{
    type: "web_search_preview"
  }],
  search_context_size: "medium" // low, medium, high
});
```

### 2. Deep Research API (Premium)
For comprehensive market research:
```javascript
const response = await openai.responses.create({
  model: "o3-deep-research-2025-06-26",
  messages: [{
    role: "user",
    content: "Research current resale value of vintage Chanel bags"
  }],
  tools: [{
    type: "web_search_preview"
  }]
});
```

## Cost Analysis for Flippi.ai

### Option 1: Add Web Search to GPT-4o
- Current: $0.15/1M input + $0.60/1M output
- With search: $25/1K calls (includes search tokens)
- **Cost increase**: ~40x more expensive per call

### Option 2: Use Selectively
- Keep GPT-4o-mini for standard scans
- Use GPT-4o + web search for luxury items only
- Trigger based on detected brand/value

### Option 3: Deep Research for High-Value
- Use o3-deep-research for items >$1000
- Provides comprehensive market analysis
- Justifies premium pricing to users

## Implementation Strategy

1. **Tiered Approach**:
   - Standard items: GPT-4o-mini (current)
   - Designer items: GPT-4o + web search
   - Luxury items: o3-deep-research

2. **User-Triggered**:
   - Add "Deep Analysis" button
   - Charge premium or require subscription
   - Show real-time market data

3. **Smart Detection**:
   ```javascript
   if (detectedBrand in LUXURY_BRANDS || estimatedValue > 500) {
     // Use web search enabled model
   }
   ```

## Next Steps

1. Test web search API with sample requests
2. Measure accuracy improvement vs cost
3. Design tiered service offering
4. Update UI to show data sources

## Example Enhanced Prompt

```javascript
const enhancedPrompt = {
  model: "gpt-4o",
  messages: [{
    role: "user",
    content: "Search current market prices for this item on eBay, Poshmark, and The RealReal. Compare recent sold listings and active listings. " + userPrompt
  }],
  tools: [{
    type: "web_search_preview",
    search_context_size: "medium"
  }]
};
```

This would provide REAL current market data, not just estimates!