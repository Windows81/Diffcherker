import ContentPage from 'components/content-page';
import { DOCS_PAGES } from 'lib/docs-pages';
import { textApiContent } from 'lib/api-meta-contents';
import ApiContentPage from 'components/new/api-content-page';
export default function TextDiffAPI() {
  return (
    <ContentPage
      pages={DOCS_PAGES}
      title="Text Diff API"
      lastRevised="September 18th, 2024"
    >
      <ApiContentPage content={textApiContent} />
    </ContentPage>
  );
}
