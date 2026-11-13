import { router } from 'expo-router';
import { Note, Screen, Section, ActionButton } from '@/components/trailmark-screen';

export default function MomentScreen() {
  return (
    <Screen title="Moment" description="One place, and what it meant to you.">
      <Section title="Moment marked"><Note>The time and location will be saved here. You can give this moment meaning after the hike.</Note></Section>
      <Section title="On the trail"><Note>Add a title, note, or photo later when you review the hike.</Note></Section>
      <ActionButton label="Return to hike" onPress={() => router.replace('/hike')} />
    </Screen>
  );
}
