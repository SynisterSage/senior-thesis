import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Note, Screen, Section, ActionButton, MomentRow } from '@/components/trailmark-screen';
import { grandPrismaticMoments } from '@/lib/trail-moments';

export default function RecapScreen() {
  const { markedCount, notes: notesParam, momentIds: momentIdsParam } = useLocalSearchParams<{ markedCount?: string; notes?: string; momentIds?: string }>();
  const total = Math.max(0, Number(markedCount) || 0);
  const notes = useMemo(() => {
    try {
      const parsed = notesParam ? JSON.parse(notesParam) : [];
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  }, [notesParam]);
  const momentIds = useMemo(() => {
    try {
      const parsed = momentIdsParam ? JSON.parse(momentIdsParam) : [];
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  }, [momentIdsParam]);
  const saveToArchive = async () => {
    await router.dismissAll();
    router.replace('/(tabs)/archive');
  };

  return (
    <Screen title="Your trail story" description="A walk told through the moments you chose to keep.">
      <Section title="The route"><Note>Your route will appear here with each mark placed back along the walk.</Note></Section>
      <Section title={`The moments · ${total}`}>
        {Array.from({ length: total }, (_, index) => {
          const moment = grandPrismaticMoments.find((candidate) => candidate.id === momentIds[index]);
          return <MomentRow key={index} label={`Moment ${String(index + 1).padStart(2, '0')}`} title={notes[index] || 'Skipped for now'} detail={moment ? `${moment.title} · ${moment.kind === 'verified-reference' ? 'Verified trail reference' : 'Personal route moment'}` : 'Your note and position on the trail.'} />;
        })}
        {!total ? <Note>No moments were marked on this hike.</Note> : null}
      </Section>
      <Section title="Your story"><Note>Come back to this hike when you want to remember more than where you went.</Note></Section>
      <ActionButton label="Save to archive" onPress={() => void saveToArchive()} />
    </Screen>
  );
}
