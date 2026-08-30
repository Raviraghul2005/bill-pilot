import { useMemo, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import clsx from 'clsx'
import dayjs from 'dayjs'

import InsightsBarChart, { type ChartBar } from '@/components/InsightsBarChart'
import ListHeading from '@/components/ListHeading'
import SubscriptionCard from '@/components/SubscriptionCard'
import { formatCurrency } from '@/lib/utils'
import {
  getMonthlySpend,
  getMonthlySpendChange,
  getUpcomingRenewals,
} from '@/lib/insights'
import { useSubscriptions } from '@/lib/subscriptions'
import { posthog } from '@/lib/posthog'

const SafeAreaView = styled(RNSafeAreaView)

const Insights = () => {
  const { subscriptions } = useSubscriptions()
  const router = useRouter()
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)

  const { bars, monthlySpend, spendChange, history } = useMemo(() => {
    const upcoming = getUpcomingRenewals(subscriptions, 7)

    return {
      bars: upcoming.map<ChartBar>((renewal) => ({
        id: renewal.id,
        label: renewal.label,
        value: renewal.amount,
      })),
      monthlySpend: getMonthlySpend(subscriptions),
      spendChange: getMonthlySpendChange(subscriptions),
      history: [...subscriptions].sort(
        (a, b) => dayjs(b.startDate ?? 0).valueOf() - dayjs(a.startDate ?? 0).valueOf()
      ),
    }
  }, [subscriptions])

  const goToSubscriptions = () => router.push('/(tabs)/subscriptions')

  const changeLabel = `${spendChange > 0 ? '+' : ''}${spendChange.toFixed(0)}%`

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View className="insights-header">
              <Text className="insights-title">Monthly Insights</Text>
            </View>

            <ListHeading title="Upcoming" onPress={goToSubscriptions} />

            <InsightsBarChart
              bars={bars}
              emptyTitle="Nothing due yet"
              emptyCopy="Add a subscription and its next renewal will show up here."
            />

            <View className="expense-card">
              <View className="expense-row">
                <Text className="expense-label">Expenses</Text>
                <Text className="expense-amount">-{formatCurrency(monthlySpend)}</Text>
              </View>
              <View className="expense-row">
                <Text className="expense-period">{dayjs().format('MMMM YYYY')}</Text>
                <Text
                  className={clsx(
                    'expense-change',
                    spendChange > 0 && 'expense-change-up',
                    spendChange < 0 && 'expense-change-down',
                    spendChange === 0 && 'expense-change-flat'
                  )}
                >
                  {changeLabel}
                </Text>
              </View>
            </View>

            <ListHeading title="History" onPress={goToSubscriptions} />
          </>
        }
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              const isExpanding = expandedSubscriptionId !== item.id
              posthog?.capture('subscription_details_toggled', {
                subscription_id: item.id,
                is_expanded: isExpanding,
                category: item.category ?? null,
                billing_interval: item.billing,
                subscription_status: item.status ?? null,
              })
              setExpandedSubscriptionId(isExpanding ? item.id : null)
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions to report on yet.</Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  )
}

export default Insights
