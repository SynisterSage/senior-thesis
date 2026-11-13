import { router } from 'expo-router';
import { Note, Screen, Section, ActionButton, TrailCard } from '@/components/trailmark-screen';

export default function ArchiveScreen() {
  return (
    <Screen title="Archive" description="The places you went, and the moments you chose to keep.">
      <Section title="Your hikes">
        <TrailCard title="Your first trail story" detail="A saved walk with the moments you chose to remember." onPress={() => router.push('/recap')} />
        <Note>Your completed hikes will collect here as stories, rather than only distance or pace.</Note>
      </Section>
      <ActionButton label="Start another hike" onPress={() => router.replace('/')} />
    </Screen>
  );
}
