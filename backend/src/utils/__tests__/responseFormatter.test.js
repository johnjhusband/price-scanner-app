const responseFormatter = require('../responseFormatter');

describe('ResponseFormatter', () => {
  describe('formatAnalysis', () => {
    test('should format basic analysis correctly', () => {
      const mockAnalysis = {
        item_identification: 'Vintage T-Shirt',
        price_range: '$20-30',
        condition_assessment: 'Good condition',
        selling_platforms: {
          eBay: '$25-30',
          'Facebook Marketplace': '$20-25'
        }
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.item_identification).toBe('Vintage T-Shirt');
      expect(result.analysis.price_range).toBe('$20-30');
      expect(result.analysis.condition_assessment).toBe('Good condition');
      expect(result.analysis.selling_platforms).toEqual({
        eBay: '$25-30',
        'Facebook Marketplace': '$20-25'
      });
      expect(result.confidence).toBe('Medium');
      expect(result.timestamp).toBeDefined();
    });

    test('should handle missing fields gracefully', () => {
      const mockAnalysis = {
        item_identification: 'Unknown Item'
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);

      expect(result).toBeDefined();
      expect(result.analysis.item_identification).toBe('Unknown Item');
      expect(result.analysis.price_range).toBeUndefined();
      expect(result.analysis.condition_assessment).toBeUndefined();
      expect(result.analysis.selling_platforms).toBeUndefined();
    });

    test('should detect high confidence when all platforms have prices', () => {
      const mockAnalysis = {
        item_identification: 'Nike Shoes',
        selling_platforms: {
          eBay: '$50-60',
          'Facebook Marketplace': '$45-55',
          Poshmark: '$55-65',
          Mercari: '$48-58'
        }
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);
      expect(result.confidence).toBe('High');
    });

    test('should detect low confidence when few platforms have prices', () => {
      const mockAnalysis = {
        item_identification: 'Rare Item',
        selling_platforms: {
          eBay: '$100-150'
        }
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);
      expect(result.confidence).toBe('Low');
    });

    test('should include timestamp in ISO format', () => {
      const mockAnalysis = {
        item_identification: 'Test Item'
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);
      const timestamp = new Date(result.timestamp);
      
      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should handle complex analysis with all fields', () => {
      const mockAnalysis = {
        item_identification: 'Vintage Levi\'s Jeans',
        price_range: '$40-60',
        condition_assessment: 'Excellent vintage condition with minor wear',
        selling_platforms: {
          eBay: '$45-55',
          'Facebook Marketplace': '$40-50',
          Poshmark: '$50-60',
          Mercari: '$42-52',
          WhatNot: 'N/A'
        },
        notable_features: ['Vintage wash', 'High-rise', 'Size 28'],
        market_insights: 'Vintage denim is trending upward'
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);

      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.confidence).toBe('High');
      expect(result.timestamp).toBeDefined();
    });

    test('should handle empty analysis object', () => {
      const mockAnalysis = {};

      const result = responseFormatter.formatAnalysis(mockAnalysis);

      expect(result).toBeDefined();
      expect(result.analysis).toEqual({});
      expect(result.confidence).toBe('Low');
      expect(result.timestamp).toBeDefined();
    });

    test('should handle null selling_platforms', () => {
      const mockAnalysis = {
        item_identification: 'Test Item',
        selling_platforms: null
      };

      const result = responseFormatter.formatAnalysis(mockAnalysis);

      expect(result.analysis.selling_platforms).toBeNull();
      expect(result.confidence).toBe('Low');
    });

    test('should calculate confidence based on platform count', () => {
      const testCases = [
        { platforms: {}, expectedConfidence: 'Low' },
        { platforms: { eBay: '$10' }, expectedConfidence: 'Low' },
        { platforms: { eBay: '$10', Facebook: '$12' }, expectedConfidence: 'Medium' },
        { platforms: { eBay: '$10', Facebook: '$12', Poshmark: '$15' }, expectedConfidence: 'High' },
        { platforms: { eBay: '$10', Facebook: '$12', Poshmark: '$15', Mercari: '$11' }, expectedConfidence: 'High' }
      ];

      testCases.forEach(({ platforms, expectedConfidence }) => {
        const result = responseFormatter.formatAnalysis({
          item_identification: 'Test',
          selling_platforms: platforms
        });
        expect(result.confidence).toBe(expectedConfidence);
      });
    });
  });
});