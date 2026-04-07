import * as TaskManager from 'expo-task-manager';
import { LOCATION_TASK_NAME, sendLocationPing } from './location';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  const [location] = data.locations;
  await sendLocationPing(location.coords.latitude, location.coords.longitude);
});
