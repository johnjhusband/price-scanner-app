class ResponseFormatter {
  formatAnalysis(analysis) {
    try {
      // Ensure we have valid analysis data
      if (!analysis || typeof analysis !== 'object') {
        throw new Error('Invalid analysis data received');
      }

      // Format the response with additional metadata
      const formattedResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        analysis: {
          itemIdentification: this.formatItemIdentification(analysis.itemIdentification),
          priceEstimates: this.formatPriceEstimates(analysis.priceEstimates),
          marketAnalysis: this.formatMarketAnalysis(analysis.marketAnalysis),
          sellingTips: this.formatSellingTips(analysis.sellingTips),
          conditionAssessment: this.formatConditionAssessment(analysis.conditionAssessment)
        },
        summary: this.generateSummary(analysis)
      };

      return formattedResponse;

    } catch (error) {
      console.error('Error formatting analysis:', error);
      return {
        success: false,
        error: 'Failed to format analysis',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  formatItemIdentification(itemId) {
    return {
      name: itemId?.name || 'Unknown Item',
      category: itemId?.category || 'Unknown Category',
      brand: itemId?.brand || 'Unknown Brand',
      model: itemId?.model || 'N/A',
      condition: itemId?.condition || 'Unknown',
      displayName: this.generateDisplayName(itemId)
    };
  }

  formatPriceEstimates(priceEstimates) {
    const platforms = ['eBay', 'facebookMarketplace', 'whatNot', 'poshmark'];
    const formatted = {};

    platforms.forEach(platform => {
      const data = priceEstimates?.[platform];
      if (data && typeof data === 'object') {
        formatted[platform] = {
          min: data.min || 0,
          max: data.max || 0,
          currency: data.currency || 'USD',
          average: Math.round((data.min + data.max) / 2),
          range: `${data.min} - ${data.max}`
        };
      } else {
        formatted[platform] = {
          min: 0,
          max: 0,
          currency: 'USD',
          average: 0,
          range: 'N/A'
        };
      }
    });

    return formatted;
  }

  formatMarketAnalysis(marketAnalysis) {
    return {
      demand: marketAnalysis?.demand || 'Unknown',
      seasonalFactors: marketAnalysis?.seasonalFactors || 'None identified',
      uniqueFeatures: marketAnalysis?.uniqueFeatures || 'None identified',
      demandLevel: this.getDemandLevel(marketAnalysis?.demand)
    };
  }

  formatSellingTips(sellingTips) {
    return {
      bestPlatforms: Array.isArray(sellingTips?.bestPlatforms) ? sellingTips.bestPlatforms : ['eBay'],
      optimalTiming: sellingTips?.optimalTiming || 'Anytime',
      keySellingPoints: Array.isArray(sellingTips?.keySellingPoints) ? sellingTips.keySellingPoints : [],
      photographyTips: Array.isArray(sellingTips?.photographyTips) ? sellingTips.photographyTips : []
    };
  }

  formatConditionAssessment(conditionAssessment) {
    return {
      description: conditionAssessment?.description || 'Condition not assessed',
      damage: conditionAssessment?.damage || 'No visible damage',
      authenticity: conditionAssessment?.authenticity || 'Authenticity not verified',
      conditionScore: this.getConditionScore(conditionAssessment?.description)
    };
  }

  generateDisplayName(itemId) {
    const parts = [];
    if (itemId?.brand) parts.push(itemId.brand);
    if (itemId?.name) parts.push(itemId.name);
    if (itemId?.model) parts.push(itemId.model);
    
    return parts.length > 0 ? parts.join(' ') : 'Unknown Item';
  }

  getDemandLevel(demand) {
    const demandLower = demand?.toLowerCase() || '';
    if (demandLower.includes('high')) return 'high';
    if (demandLower.includes('medium')) return 'medium';
    if (demandLower.includes('low')) return 'low';
    return 'unknown';
  }

  getConditionScore(description) {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('excellent') || desc.includes('mint')) return 5;
    if (desc.includes('good') || desc.includes('like new')) return 4;
    if (desc.includes('fair') || desc.includes('used')) return 3;
    if (desc.includes('poor') || desc.includes('damaged')) return 2;
    if (desc.includes('broken') || desc.includes('non-working')) return 1;
    return 3; // Default to fair
  }

  generateSummary(analysis) {
    const itemName = analysis.itemIdentification?.name || 'Item';
    const avgPrice = this.calculateAveragePrice(analysis.priceEstimates);
    const condition = analysis.itemIdentification?.condition || 'Unknown';
    const demand = analysis.marketAnalysis?.demand || 'Unknown';

    return {
      itemName,
      averagePrice: avgPrice,
      condition,
      demand,
      bestPlatform: this.getBestPlatform(analysis.priceEstimates),
      quickTip: this.generateQuickTip(analysis)
    };
  }

  calculateAveragePrice(priceEstimates) {
    if (!priceEstimates) return 0;
    
    const platforms = Object.values(priceEstimates);
    const validPrices = platforms.filter(p => p.min > 0 && p.max > 0);
    
    if (validPrices.length === 0) return 0;
    
    const totalAvg = validPrices.reduce((sum, p) => sum + (p.min + p.max) / 2, 0);
    return Math.round(totalAvg / validPrices.length);
  }

  getBestPlatform(priceEstimates) {
    if (!priceEstimates) return 'eBay';
    
    let bestPlatform = 'eBay';
    let highestAvg = 0;
    
    Object.entries(priceEstimates).forEach(([platform, data]) => {
      if (data.min > 0 && data.max > 0) {
        const avg = (data.min + data.max) / 2;
        if (avg > highestAvg) {
          highestAvg = avg;
          bestPlatform = platform;
        }
      }
    });
    
    return bestPlatform;
  }

  generateQuickTip(analysis) {
    const condition = analysis.itemIdentification?.condition?.toLowerCase() || '';
    const demand = analysis.marketAnalysis?.demand?.toLowerCase() || '';
    
    if (condition.includes('excellent') && demand.includes('high')) {
      return "Great condition and high demand! Consider listing at the higher end of the price range.";
    } else if (condition.includes('poor') || condition.includes('damaged')) {
      return "Item shows wear. Be honest about condition and price accordingly.";
    } else if (demand.includes('low')) {
      return "Lower demand item. Consider patience or competitive pricing.";
    }
    
    return "Standard resale item. Price competitively and highlight key features.";
  }
}

module.exports = new ResponseFormatter(); 