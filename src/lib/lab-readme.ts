import { labRequirements, type Lab, type LabStep } from '../data/lab-format';

function steps(items: LabStep[]): string {
  return items.map(({ text, command }, index) => {
    const number = String(index + 1) + '. ';
    const block = command ? '\n\n   \x60\x60\x60bash\n' + command.split('\n').map(line => '   ' + line).join('\n') + '\n   \x60\x60\x60' : '';
    return number + text + block;
  }).join('\n\n');
}

export function labReadme(lab: Lab): string {
  const multi = lab.exercises.length > 1;
  const heading = multi ? '# ' + lab.id.toUpperCase() + ' exercises\n\n' : '';
  const sections = lab.exercises.map(exercise => {
    const titleLevel = multi ? '##' : '#';
    const sectionLevel = titleLevel + '#';
    const headingFor = (title: string) => sectionLevel + ' ' + title + '\n\n';
    const bullets = (items: string[]) => items.map(item => '- ' + item).join('\n');
    return [
      titleLevel + ' ' + exercise.title,
      exercise.kind === 'challenge' ? 'Troubleshooting challenge' : 'Guided exercise',
      headingFor('Objective') + exercise.objective,
      headingFor('Requirements & expected results') +
        '**Requirements**\n\n' + bullets([...labRequirements, ...exercise.requirements]) +
        '\n\n**Initial state**\n\n' + exercise.initial +
        '\n\n**Expected results**\n\n' + bullets(exercise.expected),
      headingFor('Setup') + steps(exercise.setup),
      headingFor('Diagnose') + steps(exercise.diagnose),
      headingFor('Solution') + '<details>\n<summary>Reveal solution</summary>\n\n' + steps(exercise.solution) + '\n\n</details>',
      headingFor('Verify') + steps(exercise.verify),
      headingFor('Clean up') + steps(exercise.cleanup),
      headingFor('Official references') + exercise.sources.map(({ title, url }) => '- [' + title + '](' + url + ')').join('\n'),
    ].join('\n\n');
  });
  return heading + sections.join('\n\n---\n\n') + '\n';
}
