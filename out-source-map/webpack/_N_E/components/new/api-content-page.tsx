import css from '../../components/content-page.module.css';
import Icon from 'components/shared/icon';
import OkSvg from 'components/shared/icons/ok.svg';
import { ApiMetaContent } from 'lib/api-meta-contents';

export default function ApiContentPage({
  content,
}: {
  content: ApiMetaContent;
}) {
  return (
    <section>
      <section>
        <h2>Usage</h2>
        <pre className={css.codeBlock}>{content.usage}</pre>
      </section>
      <section>
        <h2>Parameters</h2>
        {Array.isArray(content.params) ? (
          <div className={css.paramsTableContainer}>
            <table className={css.paramsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>In</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {content.params.map((param, index) => (
                  <tr key={index}>
                    <td>{param.name}</td>
                    <td>{param.type}</td>
                    <td>{param.in}</td>
                    <td className={css.requiredParam}>
                      {param.required && <Icon svg={OkSvg} />}
                    </td>
                    <td>{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className={css.codeBlock}>{content.params}</pre>
        )}
      </section>
      <section>
        <h2>Examples</h2>
        <pre className={css.codeBlock}>{content.example}</pre>
      </section>
      <section>
        <h2>JSON Responses</h2>
        {content.responses?.map((res, j) => (
          <div key={j}>
            <h3>
              <pre>{res.title}</pre>
            </h3>
            <pre className={css.codeBlock}>
              {typeof res.content === 'string'
                ? res.content
                : JSON.stringify(res.content, null, 2)}
            </pre>
          </div>
        ))}
      </section>
    </section>
  );
}
