import { useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import clsx from 'clsx'

import SubscriptionCard from '@/components/SubscriptionCard'
import { searchSubscriptions } from '@/lib/utils'
import { posthog } from '@/lib/posthog'
import { useSubscriptions } from '@/lib/subscriptions'

const SafeAreaView = styled(RNSafeAreaView)

const Subscriptions = () => {
  const { subscriptions } = useSubscriptions()
  const [query, setQuery] = useState('')
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)

  const results = useMemo(
    () => searchSubscriptions(subscriptions, query),
    [subscriptions, query]
  )

  // Report searches once typing settles rather than on every keystroke. Only
  // the shape of the query is sent, never the text the user typed.
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    const timeout = setTimeout(() => {
      posthog?.capture('subscription_search_performed', {
        query_length: trimmed.length,
        result_count: results.length,
      })
    }, 600)

    return () => clearTimeout(timeout)
  }, [query, results.length])

  // Collapse on every query change: a card that stays expanded while it is
  // filtered out reappears expanded later, which reads as a glitch.
  const onChangeQuery = (text: string) => {
    setQuery(text)
    setExpandedSubscriptionId(null)
  }

  const onClearQuery = () => {
    setQuery('')
    setExpandedSubscriptionId(null)
  }

  const isSearching = query.trim().length > 0

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        // Passed as an element, not a function: an inline component type would
        // be remounted on each render and the input would lose focus per key.
        ListHeaderComponent={
          <>
            <Text className="subs-title">Subscriptions</Text>

            <View className="subs-search-wrap">
              <TextInput
                value={query}
                onChangeText={onChangeQuery}
                placeholder="Search by name, category or plan"
                placeholderTextColor="rgba(0, 0, 0, 0.35)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                className={clsx('subs-search-input', query.length > 0 && 'pr-20')}
              />
              {query.length > 0 ? (
                <Pressable className="subs-search-clear" onPress={onClearQuery} hitSlop={8}>
                  <Text className="subs-search-clear-text">Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <Text className="subs-result-count">
              {results.length} of {subscriptions.length} subscriptions
            </Text>
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
          <View className="subs-empty">
            <Text className="subs-empty-title">
              {isSearching ? 'No matches' : 'No subscriptions yet'}
            </Text>
            <Text className="subs-empty-copy">
              {isSearching
                ? `Nothing matches "${query.trim()}". Try a different name, category or plan.`
                : 'Subscriptions you add will show up here.'}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  )
}

export default Subscriptions
