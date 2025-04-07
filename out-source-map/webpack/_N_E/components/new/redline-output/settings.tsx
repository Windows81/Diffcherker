export enum FontColorOptions {
  NoHighlight = 'NoHighlight',
  Black = 'Black',
  Blue = 'Blue',
  BrightGreen = 'BrightGreen',
  DarkBlue = 'DarkBlue',
  DarkRed = 'DarkRed',
  DarkYellow = 'DarkYellow',
  Gray25 = 'Gray25',
  Gray50 = 'Gray50',
  Green = 'Green',
  Pink = 'Pink',
  Red = 'Red',
  Teal = 'Teal',
  Turquoise = 'Turquoise',
  Violet = 'Violet',
  White = 'White',
  Yellow = 'Yellow',
}

export const defaultRedlineOutputSettings: RedlineOutputSettingsObject = {
  insertedColor: 'Green',
  deletedColor: 'Red',
  granularity: 'WordLevel' as 'WordLevel' | 'CharacterLevel',
  compareFormatting: true,
  compareCaseChanges: true,
  compareWhitespace: true,
  compareTables: true,
  compareHeaders: true,
  compareFootnotes: true,
  compareTextboxes: true,
  compareFields: true,
  compareComments: true,
  compareMoves: true,
  revisedAuthor: '',
};

export type RedlineOutputSettingsObject = {
  insertedColor: string;
  deletedColor: string;
  granularity: 'WordLevel' | 'CharacterLevel';
  compareFormatting: boolean;
  compareCaseChanges: boolean;
  compareWhitespace: boolean;
  compareTables: boolean;
  compareHeaders: boolean;
  compareFootnotes: boolean;
  compareTextboxes: boolean;
  compareFields: boolean;
  compareComments: boolean;
  compareMoves: boolean;
  revisedAuthor: '';
};
