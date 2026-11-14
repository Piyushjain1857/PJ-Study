import React, { useState } from 'react';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Accessible SVG-based student activity chart.
 *
 * @param {{
 *   analytics: {
 *     range?: string,
 *     days?: number,
 *     startDate?: string,
 *     endDate?: string,
 *     totals?: {
 *       bookmarks: number,
 *       downloads: number,
 *       uploads: number,
 *       collections: number,
 *       totalEvents: number
 *     },
 *     timeline?: Array<{
 *       date: string,
 *       bookmarks: number,
 *       downloads: number,
 *       uploads: number,
 *       collections: number,
 *       total: number
 *     }>
 *   },
 *   activeRange: '7d' | '30d' | '90d',
 *   onRangeChange: (range: '7d' | '30d' | '90d') => void,
 *   loading?: boolean
 * }} props
 */
export function DashboardActivityChart({
  analytics = {},
  activeRange = '7d',
  onRangeChange,
  loading = false
}) {
  const [activeMetric, setActiveMetric] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const timeline = analytics?.timeline || [];
  const totals = analytics?.totals || {
    bookmarks: 0,
    downloads: 0,
    uploads: 0,
    collections: 0,
    totalEvents: 0
  };

  // Determine which metric values to plot
  const getMetricValue = (item) => {
    switch (activeMetric) {
      case 'downloads':
        return item.downloads;
      case 'bookmarks':
        return item.bookmarks;
      case 'uploads':
        return item.uploads;
      case 'collections':
        return item.collections;
      case 'all':
      default:
        return item.total;
    }
  };

  const metricColors = {
    all: { stroke: '#285943', fill: '#285943' },
    downloads: { stroke: '#2d68c4', fill: '#2d68c4' },
    bookmarks: { stroke: '#c58a43', fill: '#c58a43' },
    uploads: { stroke: '#7c3aed', fill: '#7c3aed' },
    collections: { stroke: '#0891b2', fill: '#0891b2' }
  };

  const currentColor = metricColors[activeMetric] || metricColors.all;

  // Chart dimensions
  const width = 700;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate scales
  const values = timeline.map(getMetricValue);
  const maxValRaw = Math.max(...values, 0);
  // Ensure minimum top scale for visual balance
  const maxY = Math.max(maxValRaw, 4);

  // Generate coordinates
  const points = timeline.map((item, index) => {
    const x =
      timeline.length > 1
        ? paddingLeft + (index / (timeline.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const val = getMetricValue(item);
    const y = paddingTop + chartHeight - (val / maxY) * chartHeight;
    return { x, y, val, item, index };
  });

  // Construct SVG path data
  let linePath = '';
  let areaPath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    const groundY = paddingTop + chartHeight;
    areaPath = `${linePath} L ${points[points.length - 1].x} ${groundY} L ${points[0].x} ${groundY} Z`;
  }

  // Format short date (e.g. "Nov 8")
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${monthNames[monthIdx]} ${day}`;
    }
    return dateStr;
  };

  // Determine which X axis labels to render based on range
  const labelInterval = activeRange === '7d' ? 1 : activeRange === '30d' ? 5 : 15;

  return (
    <div className="dash-analytics-card">
      <div className="dash-analytics-header">
        <div className="dash-analytics-titles">
          <h2>Your Activity Overview</h2>
          <p>Recorded study events, downloads, and notes organization over time.</p>
        </div>

        <div className="dash-analytics-controls">
          {/* Metric Filter */}
          <div className="dash-metric-switcher" role="tablist" aria-label="Metric Filter">
            <button
              type="button"
              className={`dash-pill-btn ${activeMetric === 'all' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => setActiveMetric('all')}
            >
              All Events ({totals.totalEvents})
            </button>
            <button
              type="button"
              className={`dash-pill-btn ${activeMetric === 'downloads' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => setActiveMetric('downloads')}
            >
              Downloads ({totals.downloads})
            </button>
            <button
              type="button"
              className={`dash-pill-btn ${activeMetric === 'bookmarks' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => setActiveMetric('bookmarks')}
            >
              Saved ({totals.bookmarks})
            </button>
            <button
              type="button"
              className={`dash-pill-btn ${activeMetric === 'uploads' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => setActiveMetric('uploads')}
            >
              Uploads ({totals.uploads})
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="dash-range-switcher" role="tablist" aria-label="Date Range">
            <button
              type="button"
              className={`dash-pill-btn ${activeRange === '7d' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => onRangeChange?.('7d')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`dash-pill-btn ${activeRange === '30d' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => onRangeChange?.('30d')}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`dash-pill-btn ${activeRange === '90d' ? 'dash-pill-btn--active' : ''}`}
              onClick={() => onRangeChange?.('90d')}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px 0' }}>
          <Skeleton height={200} />
        </div>
      ) : timeline.length === 0 || totals.totalEvents === 0 ? (
        <div className="dash-empty-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="40"
            height="40"
          >
            <path d="M12 20V10M18 20V4M6 20v-4" />
          </svg>
          <p>
            No study activity recorded during this{' '}
            {activeRange === '7d' ? 'past week' : activeRange === '30d' ? 'past month' : 'quarter'}.
            As you download study guides, save bookmarks, and organize collections, your progress
            timeline will appear here.
          </p>
        </div>
      ) : (
        <div className="dash-chart-container">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="dash-chart-svg"
            role="img"
            aria-label={`Activity line chart showing ${activeMetric} over ${activeRange}`}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={currentColor.fill} stopOpacity="0.25" />
                <stop offset="100%" stopColor={currentColor.fill} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <g className="dash-chart-grid">
              <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} />
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight / 2}
                x2={width - paddingRight}
                y2={paddingTop + chartHeight / 2}
              />
              <line
                x1={paddingLeft}
                y1={paddingTop + chartHeight}
                x2={width - paddingRight}
                y2={paddingTop + chartHeight}
              />
            </g>

            {/* Y Axis Labels */}
            <g className="dash-chart-axis">
              <text x={paddingLeft - 10} y={paddingTop + 4} textAnchor="end">
                {maxY}
              </text>
              <text x={paddingLeft - 10} y={paddingTop + chartHeight / 2 + 4} textAnchor="end">
                {Math.round(maxY / 2)}
              </text>
              <text x={paddingLeft - 10} y={paddingTop + chartHeight + 4} textAnchor="end">
                0
              </text>
            </g>

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

            {/* Main Series Line */}
            {linePath && (
              <path
                d={linePath}
                className="dash-chart-line"
                style={{ stroke: currentColor.stroke }}
              />
            )}

            {/* Data Points */}
            {points.map((pt) => (
              <circle
                key={pt.item.date}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.item?.date === pt.item.date ? 6 : 3.5}
                className="dash-chart-point"
                style={{ stroke: currentColor.stroke }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                tabIndex={0}
                role="button"
                aria-label={`${formatShortDate(pt.item.date)}: ${pt.val} ${activeMetric}`}
              />
            ))}

            {/* X Axis Date Labels */}
            <g className="dash-chart-axis">
              {points.map((pt, idx) => {
                const isEdge = idx === 0 || idx === points.length - 1;
                const shouldShow = idx % labelInterval === 0 || isEdge;
                if (!shouldShow) return null;
                return (
                  <text
                    key={pt.item.date}
                    x={pt.x}
                    y={paddingTop + chartHeight + 20}
                    textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                  >
                    {formatShortDate(pt.item.date)}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="dash-chart-tooltip"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`
              }}
            >
              <div className="dash-chart-tooltip__date">
                {formatShortDate(hoveredPoint.item.date)}
              </div>
              <div className="dash-chart-tooltip__value">
                <span>{hoveredPoint.val}</span>
                <span>
                  {activeMetric === 'all'
                    ? 'Total Events'
                    : activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}
                </span>
              </div>
              {activeMetric === 'all' && (
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
                  {hoveredPoint.item.downloads} downloads • {hoveredPoint.item.bookmarks} saved •{' '}
                  {hoveredPoint.item.uploads} uploads
                </div>
              )}
            </div>
          )}

          {/* Chart Legend */}
          <div className="dash-chart-legend">
            <div className="dash-chart-legend-item">
              <span className="dash-chart-legend-dot" style={{ backgroundColor: '#2d68c4' }} />
              <span>Downloads</span>
            </div>
            <div className="dash-chart-legend-item">
              <span className="dash-chart-legend-dot" style={{ backgroundColor: '#c58a43' }} />
              <span>Saved Notes</span>
            </div>
            <div className="dash-chart-legend-item">
              <span className="dash-chart-legend-dot" style={{ backgroundColor: '#7c3aed' }} />
              <span>Uploads</span>
            </div>
            <div className="dash-chart-legend-item">
              <span className="dash-chart-legend-dot" style={{ backgroundColor: '#0891b2' }} />
              <span>Collections</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardActivityChart;
