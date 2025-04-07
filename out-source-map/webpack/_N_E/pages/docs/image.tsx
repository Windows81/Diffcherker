import ContentPage from 'components/content-page';
import { DOCS_PAGES } from 'lib/docs-pages';
import { imageApiContent } from 'lib/api-meta-contents';
import ApiContentPage from 'components/new/api-content-page';

export default function ImageDiffAPI() {
  return (
    <ContentPage
      pages={DOCS_PAGES}
      title="Image Diff API"
      lastRevised="September 18th, 2024"
    >
      <ApiContentPage content={imageApiContent} />
    </ContentPage>
  );
}
