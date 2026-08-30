import { View, Text } from 'react-native'
import clsx from 'clsx'

import { components } from '@/constants/theme'
import { getAxisTicks, getNiceAxisMax } from '@/lib/insights'

const chart = components.chart

// Keeps a small-but-real amount visible instead of collapsing it to a hairline.
const MIN_BAR_HEIGHT = 6

export type ChartBar = {
  id: string;
  label: string;
  value: number;
}

type InsightsBarChartProps = {
  bars: ChartBar[];
  emptyTitle: string;
  emptyCopy: string;
}

const InsightsBarChart = ({ bars, emptyTitle, emptyCopy }: InsightsBarChartProps) => {
  if (!bars.length) {
    return (
      <View className="chart-card">
        <View className="chart-empty" style={{ height: chart.height }}>
          <Text className="chart-empty-title">{emptyTitle}</Text>
          <Text className="chart-empty-copy">{emptyCopy}</Text>
        </View>
      </View>
    )
  }

  const values = bars.map((bar) => bar.value)
  const axisMax = getNiceAxisMax(Math.max(...values))
  const ticks = getAxisTicks(axisMax, chart.tickCount)

  // Only the single largest bar is called out, matching the design's one badge.
  const peakValue = Math.max(...values)
  const peakId = bars.find((bar) => bar.value === peakValue)?.id

  return (
    <View className="chart-card">
      {/* The axis sits beside a column holding the plot and its day labels, so
          the labels line up with the bars rather than the whole card. */}
      <View className="chart-plot">
        <View className="chart-axis" style={{ height: chart.height }}>
          {ticks.map((tick) => (
            <Text key={tick} className="chart-axis-label">
              {Math.round(tick)}
            </Text>
          ))}
        </View>

        <View className="chart-stack">
          <View className="chart-canvas" style={{ height: chart.height }}>
            <View className="chart-grid">
              {ticks.map((tick) => (
                <View key={tick} className="chart-gridline" />
              ))}
            </View>

            <View className="chart-bars">
              {bars.map((bar) => {
                const isPeak = bar.id === peakId
                const height =
                  bar.value <= 0
                    ? 0
                    : Math.max(MIN_BAR_HEIGHT, (bar.value / axisMax) * chart.height)

                return (
                  <View key={bar.id} className="chart-bar-slot">
                    {isPeak && bar.value > 0 ? (
                      <View className="chart-tooltip">
                        <Text className="chart-tooltip-text">${Math.round(bar.value)}</Text>
                      </View>
                    ) : null}
                    <View
                      className={clsx('chart-bar', isPeak && 'chart-bar-peak')}
                      style={{ height, width: chart.barWidth }}
                    />
                  </View>
                )
              })}
            </View>
          </View>

          <View className="chart-labels">
            {bars.map((bar) => (
              <View key={bar.id} className="chart-label-slot">
                <Text className="chart-day-label" numberOfLines={1}>
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

export default InsightsBarChart
