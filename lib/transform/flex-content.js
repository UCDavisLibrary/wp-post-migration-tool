import { JSDOM } from "jsdom";

class FlexContentTransform {

  constructor() {
    this.UCD_COLUMN_INDEX_NAMES = {
      1 : 'first',
      2 : 'second',
      3 : 'third',
      4 : 'forth',
      5 : 'fifth',
      6 : 'sixth'
    }
  }

  cssHeader() {
    return `<style>

  [align="alignleft"] {
    margin: 0px 15px 10px 0;
    max-width: 50%;
    min-width: unset;
    float: left;
  }

  [align="alignleft"] img {
    min-width: 100%;
  }


  [align="alignright"] {
      float: right;
      margin: 0px 0 10px 15px;
      max-width: 50%;
      min-width: unset;
  }

  [align="alignright"] {
    margin: 0 auto;
    padding: 15px 0px;
    display: block;
  }

  @media (min-width: 769px) {
    [align="alignleft"] {
        margin: 10px 30px 10px 0;
        max-width: 50%;
        min-width: unset;
    }
    
    
    [align="alignright"] {
        margin: 10px 0 10px 20px;
        max-width: 50%;
        min-width: unset;
    }
  }

  @media (min-width: 970px) {

  }

  .l-2col, .l-3col, .l-4col, .l-4col {
      width: 100%;
  }  
</style>`;
  }

  transform(flexibleContent) {
    let html = this.handleShortcodes(flexibleContent.wysiwyg || '');
    let window = new JSDOM(html).window;
    let rootNodes = Array.from(window.document.body.childNodes);

    let state = {html : ''};

    if(  flexibleContent.block_title || flexibleContent.anchor_label ) {
      state.html += '<h2>'+(flexibleContent.block_title || flexibleContent.anchor_label)+'</h2>';
    }

    for( let node of rootNodes ) {
      this.handleNode(node, state);
    }

    this.checkBlockEnd(state);

    return state.html;
  }

  handleShortcodes(html) {
    return html
      .replace(/\[\/.+?\]/g, '</span>')
      .replace(/\[([a-zA-Z-]+) (.+?)\]/g, '<span shortcode="$1" $2>')
  }

  handleNode(node, state) {
    switch(node.nodeName) {
      case 'TABLE':
        this.handleTable(node, state);
        break;
      case '#text':
        this.handleDefaultNode(node, state, true);
        break;
      default:
        this.handleDefaultNode(node, state);
    }
  }

  handleDefaultNode(node, state, text=false) {
    if( state.defaultBlock !== true ) {
      state.defaultBlock = true;
      state.html += '<p>\n';
    }

    if( text ) {
      if( node.nodeValue.trim() ) {
        state.html += '<span>'+node.nodeValue.trim()+'</span>\n';
      }
    } else {
      state.html += node.outerHTML+'\n';
    }
  }

  handleTable(node, state) {
    this.checkBlockEnd(state);

    let table = Array.from(node.querySelectorAll('tr'))
      .map(row => Array.from(row.querySelectorAll('td'))
        .map(td => td.innerHTML.trim())
      );

    // if single column table, just dump each column as new paragraph
    if( table.length && table[0].length === 1 ) {
      state.html += table.map(row => `
        ${row.map((column, i) => `
          <!-- wp:paragraph -->
          <p>${column}</p>
          <!-- /wp:paragraph -->
        `).join('\n')}
      `).join('\n');
      return;
    }

  
    state.html += table.map(row => `<!-- wp:ucd-theme/layout-columns -->
      ${row.map((column, i) => `<!-- wp:ucd-theme/column {"layoutClass":"l-${this.UCD_COLUMN_INDEX_NAMES[i+1]}","forbidWidthEdit":true} -->
        <!-- wp:paragraph -->
        <p>${column}</p>
        <!-- /wp:paragraph -->
        <!-- /wp:ucd-theme/column -->
      `).join('\n')}
    <!-- /wp:ucd-theme/layout-columns -->`).join('\n');
  }

  checkBlockEnd(state) {
    if( state.defaultBlock === true ) {
      state.defaultBlock = false;
      state.html += '</p>\n';
    }
  }
  

}

const instance = new FlexContentTransform();
export default instance;