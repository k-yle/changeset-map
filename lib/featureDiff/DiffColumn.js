import React from 'react';
import PropTypes from 'prop-types';
import { config } from '../config';

export class DiffColumn extends React.Component {
  render() {
    return (
      <td className={this.props.propClass}>
        <DiffColumnContent {...this.props} {...this.context} />
      </td>
    );
  }
}

const DiffColumnContent = function({ diff, prop, type, tag2link }) {
  let renderOutput;
  const value = diff[prop][type],
    propIsWikidata = typeof prop == 'string' && /wikidata$/.test(prop);
  if (prop === 'changeset' && type === 'modifiedOld') {
    // Link to the last changeset that affected the element before this
    renderOutput = (
      <a
        target="_blank"
        rel="noopener noreferrer"
        className="cmap-changeset-link"
        href={`${config.osmchaBase}changesets/${value}`}
        title={`See changeset ${value}`}
      >
        {value}
      </a>
    );
  } else if (propIsWikidata && typeof value === 'string') {
    // The tag is a reference to Wikidata, transform the value into a link
    // https://wiki.openstreetmap.org/wiki/Wikidata
    const wikidataQIdArray = value.split(';'),
      renderArray = [];
    wikidataQIdArray.forEach((QId, index) => {
      const isValidWikidataQId = /^Q\d+$/.test(QId);

      if (index !== 0) renderArray.push(<span>;</span>);

      if (isValidWikidataQId) {
        renderArray.push(
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="cmap-wikidata-link"
            href={`https://www.wikidata.org/wiki/${QId}`}
            title={`Access Wikidata entity ${QId}`}
          >
            {QId}
          </a>
        );
      } else {
        renderArray.push(<span>{QId}</span>);
      }
    });
    renderOutput = <span>{renderArray}</span>;
  } else if (tag2link[prop] && typeof value === 'string') {
    // This is a foreign key which is defined in the tag2link DB.
    // So, we render a clickable link.
    renderOutput = (
      <span>
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="cmap-wikidata-link"
          href={tag2link[prop].replace(/\$1/g, value)}
        >
          {value}
        </a>
      </span>
    );
  } else {
    // Standard tag, no processing needed
    renderOutput = <span>{value}</span>;
  }
  return renderOutput;
};

DiffColumn.propTypes = {
  diff: PropTypes.object.isRequired,
  prop: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  propClass: PropTypes.string
};

DiffColumn.contextTypes = {
  tag2link: PropTypes.objectOf(PropTypes.string)
};
