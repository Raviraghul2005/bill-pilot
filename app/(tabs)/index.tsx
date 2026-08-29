import images from "@/constants/images";
import "@/global.css";
import { FlatList, Image, Pressable, Text, View } from "react-native";

import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import {
  HOME_BALANCE,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
} from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import { useSubscriptions } from "@/lib/subscriptions";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const { subscriptions, addSubscription } = useSubscriptions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
        <FlatList
          ListHeaderComponent={() => (
            <>
            <View className="home-header">
              <View className="home-user">
                <Image source={images.avatar} className="home-avatar" />
                <Text className="home-user-name">{HOME_USER.name}</Text>
              </View>
              <Pressable
                onPress={() => {
                  posthog?.capture('create_subscription_opened');
                  setIsCreateOpen(true);
                }}
                hitSlop={8}
                accessibilityLabel="Add subscription"
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="upcoming" />
              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">No upcoming renewals yet.</Text>
                }
              />
            </View>

            <ListHeading title="All Subscriptions" />
            </>
          )}
          data={subscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() => {
                const isExpanding = expandedSubscriptionId !== item.id;
                posthog?.capture('subscription_details_toggled', {
                  subscription_id: item.id,
                  is_expanded: isExpanding,
                  category: item.category ?? null,
                  billing_interval: item.billing,
                  subscription_status: item.status ?? null,
                });
                setExpandedSubscriptionId(isExpanding ? item.id : null);
              }}
            />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="home-empty-state">No Subscriptions yet.</Text>
          }
          contentContainerClassName="pb-30"
        />

        <CreateSubscriptionModal
          visible={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={addSubscription}
        />
    </SafeAreaView>
  );
}
