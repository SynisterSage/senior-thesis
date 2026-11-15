import { NativeTabs } from 'expo-router/native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="trails">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="archive">
        <NativeTabs.Trigger.Label>Archive</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.stack', selected: 'square.stack.fill' }} md="collections_bookmark" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nod">
        <NativeTabs.Trigger.Label>Nod</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hand.tap', selected: 'hand.tap.fill' }} md="touch_app" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
