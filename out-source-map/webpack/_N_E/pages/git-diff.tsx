import { GitDiffViewElectron } from 'lib/git-diff/GitDiffViewElectron';
import { GitDiffViewWeb } from 'lib/git-diff/GitDiffViewWeb';

export default !process.env.NEXT_PUBLIC_IS_ELECTRON
  ? GitDiffViewWeb
  : GitDiffViewElectron;
