import { advancedLabs, recoveryLab } from './advanced-labs';
import { capstoneLabs } from './capstone-labs';
import { foundationLabs } from './foundation-labs';
import { intermediateLabs } from './intermediate-labs';
import { moduleLabFiles } from './lab-files';
import type { Lab } from './lab-format';
import { practiceLabs } from './practice-labs';
import { serviceLab } from './service-lab';

const moduleExercises = [...foundationLabs, serviceLab, ...intermediateLabs, ...advancedLabs];

export const moduleLabs: Lab[] = [
  ...moduleExercises.map(exercise => ({
    id: exercise.id,
    moduleId: exercise.id,
    files: moduleLabFiles[exercise.id],
    exercises: exercise.id === 'm18' ? [exercise, recoveryLab] : [exercise],
  })),
  { id: 'm20', moduleId: 'm20', files: moduleLabFiles.m20, exercises: capstoneLabs },
];
export const labs = [...moduleLabs, ...practiceLabs];
export const labDownloadPaths = ['README.md', 'kind.yaml', 'setup.sh', 'lab-env.sh', ...labs.flatMap(lab => lab.files.map(file => lab.id + '/' + file))];
