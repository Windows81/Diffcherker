import ContentPage from 'components/content-page';
import { DOCS_PAGES } from 'lib/docs-pages';
import { documentApiContent } from 'lib/api-meta-contents';
import ApiContentPage from 'components/new/api-content-page';

export default function DocumentDiffAPI() {
  return (
    <ContentPage
      pages={DOCS_PAGES}
      title="Document Diff API"
      lastRevised="September 18th, 2024"
    >
      <ApiContentPage content={documentApiContent} />
    </ContentPage>
  );
}
