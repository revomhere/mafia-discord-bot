import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from '@/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveAlias = (dir: string) => {
  if (dir.startsWith('@/')) {
    return path.join(path.resolve(__dirname, '../'), dir.replace(/^@\//, ''));
  }
  return path.resolve(__dirname, dir);
};

const importCommand = async <T>(file: string): Promise<T> => {
  const module = await import(file);

  return module.default || module;
};

export const getTsFileNames = (dir: string): string[] => {
  const absoluteDir = resolveAlias(dir);

  const files = fs.readdirSync(absoluteDir, { withFileTypes: true });

  return files.flatMap(file => {
    if (file.isDirectory()) {
      return getTsFileNames(path.join(absoluteDir, file.name));
    }

    if (file.name.endsWith('.ts')) {
      return [path.join(absoluteDir, file.name)];
    }

    return [];
  });
};

export const getCommands = async (dir: string) => {
  const names = getTsFileNames(dir);

  const commandPromises = names.map(async fileName => {
    const command = await importCommand<Command>(fileName.replace(/\\/g, '/'));

    command.data.setName(
      command.data.name || fileName.split('/').pop()?.replace('.ts', '') || 'unknown'
    );

    return command;
  });

  return Promise.all(commandPromises);
};
