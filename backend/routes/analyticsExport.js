/**
 * Analytics Export Routes
 * Issue #150: Export functionality for analytics data
 */

const express = require('express');
const router = express.Router();
const GrowthAnalyticsService = require('../services/growthAnalytics');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

/**
 * Export analytics data as CSV
 * GET /api/growth/analytics/export/csv?start=YYYY-MM-DD&end=YYYY-MM-DD&type=summary
 */
router.get('/csv', async (req, res) => {
    try {
        const { start, end, type = 'summary' } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start and end dates required' 
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        let data;
        let fields;
        let filename;

        switch (type) {
            case 'summary':
                // Get summary data
                data = await GrowthAnalyticsService.getAnalyticsSummary(startDate, endDate);
                fields = ['date', 'total_views', 'total_clicks', 'total_shares', 'click_through_rate', 'conversions'];
                filename = `analytics_summary_${start}_${end}.csv`;
                break;
                
            case 'content':
                // Get content performance data
                data = await GrowthAnalyticsService.getContentPerformance(startDate, endDate);
                fields = ['content_id', 'title', 'type', 'platform', 'views', 'clicks', 'shares', 'ctr', 'created_at'];
                filename = `content_performance_${start}_${end}.csv`;
                break;
                
            case 'platform':
                // Get platform breakdown
                data = await GrowthAnalyticsService.getPlatformBreakdown(startDate, endDate);
                fields = ['platform', 'views', 'clicks', 'shares', 'conversions', 'engagement_rate'];
                filename = `platform_breakdown_${start}_${end}.csv`;
                break;
                
            case 'conversion':
                // Get conversion funnel data
                data = await GrowthAnalyticsService.getConversionFunnel(startDate, endDate);
                fields = ['stage', 'users', 'conversion_rate', 'drop_off_rate'];
                filename = `conversion_funnel_${start}_${end}.csv`;
                break;
                
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid export type' 
                });
        }

        // Convert to CSV
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);

    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Export analytics data as Excel
 * GET /api/growth/analytics/export/excel?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get('/excel', async (req, res) => {
    try {
        const { start, end } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start and end dates required' 
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Flippi.ai Growth Analytics';
        workbook.created = new Date();

        // Add Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        const summaryData = await GrowthAnalyticsService.getAnalyticsSummary(startDate, endDate);
        
        summarySheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Views', key: 'total_views', width: 15 },
            { header: 'Clicks', key: 'total_clicks', width: 15 },
            { header: 'Shares', key: 'total_shares', width: 15 },
            { header: 'CTR %', key: 'click_through_rate', width: 15 },
            { header: 'Conversions', key: 'conversions', width: 15 }
        ];
        
        summarySheet.addRows(summaryData);
        
        // Style the header row
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };

        // Add Content Performance Sheet
        const contentSheet = workbook.addWorksheet('Content Performance');
        const contentData = await GrowthAnalyticsService.getContentPerformance(startDate, endDate);
        
        contentSheet.columns = [
            { header: 'Content ID', key: 'content_id', width: 12 },
            { header: 'Title', key: 'title', width: 40 },
            { header: 'Type', key: 'type', width: 20 },
            { header: 'Platform', key: 'platform', width: 15 },
            { header: 'Views', key: 'views', width: 12 },
            { header: 'Clicks', key: 'clicks', width: 12 },
            { header: 'Shares', key: 'shares', width: 12 },
            { header: 'CTR %', key: 'ctr', width: 12 },
            { header: 'Created', key: 'created_at', width: 20 }
        ];
        
        contentSheet.addRows(contentData);
        contentSheet.getRow(1).font = { bold: true };
        contentSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };

        // Add Platform Breakdown Sheet
        const platformSheet = workbook.addWorksheet('Platform Breakdown');
        const platformData = await GrowthAnalyticsService.getPlatformBreakdown(startDate, endDate);
        
        platformSheet.columns = [
            { header: 'Platform', key: 'platform', width: 20 },
            { header: 'Views', key: 'views', width: 15 },
            { header: 'Clicks', key: 'clicks', width: 15 },
            { header: 'Shares', key: 'shares', width: 15 },
            { header: 'Conversions', key: 'conversions', width: 15 },
            { header: 'Engagement Rate %', key: 'engagement_rate', width: 20 }
        ];
        
        // Convert object to array for Excel
        const platformRows = Object.entries(platformData).map(([platform, data]) => ({
            platform,
            ...data
        }));
        
        platformSheet.addRows(platformRows);
        platformSheet.getRow(1).font = { bold: true };
        platformSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };

        // Add Conversion Funnel Sheet
        const conversionSheet = workbook.addWorksheet('Conversion Funnel');
        const conversionData = await GrowthAnalyticsService.getConversionFunnel(startDate, endDate);
        
        conversionSheet.columns = [
            { header: 'Stage', key: 'stage', width: 30 },
            { header: 'Users', key: 'users', width: 15 },
            { header: 'Conversion Rate %', key: 'conversion_rate', width: 20 },
            { header: 'Drop-off Rate %', key: 'drop_off_rate', width: 20 }
        ];
        
        conversionSheet.addRows(conversionData);
        conversionSheet.getRow(1).font = { bold: true };
        conversionSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' }
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        // Set headers for download
        const filename = `flippi_analytics_${start}_${end}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Export analytics data as JSON
 * GET /api/growth/analytics/export/json?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get('/json', async (req, res) => {
    try {
        const { start, end } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start and end dates required' 
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Gather all analytics data
        const [summary, content, platforms, conversion] = await Promise.all([
            GrowthAnalyticsService.getAnalyticsSummary(startDate, endDate),
            GrowthAnalyticsService.getContentPerformance(startDate, endDate),
            GrowthAnalyticsService.getPlatformBreakdown(startDate, endDate),
            GrowthAnalyticsService.getConversionFunnel(startDate, endDate)
        ]);

        const exportData = {
            metadata: {
                exported_at: new Date().toISOString(),
                date_range: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                },
                version: '1.0'
            },
            summary,
            content_performance: content,
            platform_breakdown: platforms,
            conversion_funnel: conversion
        };

        // Set headers for download
        const filename = `flippi_analytics_${start}_${end}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(exportData);

    } catch (error) {
        console.error('JSON export error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;