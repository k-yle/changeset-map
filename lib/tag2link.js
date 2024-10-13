// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

const URL = 'https://cdn.jsdelivr.net/gh/JOSM/tag2link@master/index.json';

const RANKS = ['deprecated', 'normal', 'preferred'];

/** @type {Promise<State> | undefined} */
let promise;

/**
 * @param {Tag2LinkItem[]} input
 * @returns {State}
 */
function convertSourceData(input) {
  /** @type {Record<string, string>} */
  const output = {};

  const allKeys = new Set(input.map(item => item.key));

  for (const key of allKeys) {
    // find the item with the best rank
    const bestDefinition = input
      .filter(item => item.key === key)
      .sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0];

    output[key.replace('Key:', '')] = bestDefinition.url;
  }

  return { tag2link: output };
}

/**
 * @typedef {{
 *  key: `Key:${string}`;
 *  url: string;
 *  source: string;
 *  rank: "normal" | "preferred";
 * }} Tag2LinkItem
 *
 * @typedef {{
 *   tag2link: Record<string, string>;
 * }} State
 *
 * @typedef {React.PropsWithChildren} Props
 */

/** @type {React.Component<Props, State>} */
export class Tag2LinkContext extends React.Component {
  /** @param {Props} props */
  constructor(props) {
    super(props);
    this.state = { tag2link: {} };
  }

  componentDidMount() {
    if (!promise) {
      promise = fetch(URL)
        .then(r => r.json())
        .then(convertSourceData);
    }
    promise.then(state => this.setState(state));
  }

  getChildContext() {
    return this.state;
  }

  render() {
    return this.props.children;
  }
}

Tag2LinkContext.propTypes = {
  children: PropTypes.node
};

Tag2LinkContext.childContextTypes = {
  tag2link: PropTypes.objectOf(PropTypes.string)
};
