import { JSDOM } from "jsdom";
import wp from '../wp.js';
import striptags from "striptags";
import {transformElement as transformImg} from './images.js';

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

  async transform(flexibleContent) {
    if( flexibleContent.acf_fc_layout === 'link_list_new' ) {
      return this.handleLinkListNew(flexibleContent);
    }
    if( flexibleContent.acf_fc_layout === 'list_descriptions' ) {
      return this.handleListDescriptions(flexibleContent);
    }

    let html = await this.handleShortcodes(flexibleContent.wysiwyg || '');   
    let window = new JSDOM('<html><body>'+html+'</body></html>').window;
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

  async handleShortcodes(html) {
    html = html
      .replace(/\[\/.+?\]/g, '</span>')
      .replace(/\[([a-zA-Z-]+) (.+?)\]/g, '<span shortcode="$1" $2>');

    let window = new JSDOM(html).window;
    let galleries = window.document.querySelectorAll('[shortcode="gallery"]');
    if( galleries ) {
      galleries = Array.from(galleries);
      for( let gallery of galleries ) {
        await this.handleGallery(window, gallery);
      }
    }

    let captions = window.document.querySelectorAll('[shortcode="caption"]');
    if( captions ) {
      captions = Array.from(captions);
      for( let caption of captions ) {
        transformImg(window, caption);
        let children = Array.from(caption.childNodes);
        for( let child of children ) {
          child.remove();
          caption.parentElement.insertBefore(child, caption);
        }
        caption.remove();
      }
    }

    return window.document.body.innerHTML;
  }


  async handleGallery(window, gallery) {
    let ids = gallery.getAttribute('ids').split(',');

    let html = '<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped">'

    for( let i = 0; i < ids.length; i++ ) {
      let imgData = await wp.get('media', ids[i], true);
      html += `
      <!-- wp:image {"id":"${ids[i]}","linkDestination":"custom"} -->
        <figure class="wp-block-image">
          <img src="${imgData.source_url}" alt="${imgData.alt_text}" />
          <figcaption>
            ${striptags(imgData?.caption?.rendered || '')}
          </figcaption>
        </figure>
      <!-- /wp:image -->
      `
    }

    // let columns = this.renderColumns(rows);
    // console.log(columns);
    gallery.innerHTML = html+'</figure><!-- /wp:gallery -->';
  }

  // async handleCaption(window, caption) {
  //   let ids = gallery.getAttribute('ids').split(',');

  //   let html = '<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped">'

  //   for( let i = 0; i < ids.length; i++ ) {
  //     let imgData = await wp.get('media', ids[i], true);
  //     html += `
  //     <!-- wp:image {"id":"${ids[i]}","linkDestination":"custom"} -->
  //       <figure class="wp-block-image">
  //         <img src="${imgData.source_url}" alt="${imgData.alt_text}" />
  //         <figcaption>
  //           ${striptags(imgData?.caption?.rendered || '')}
  //         </figcaption>
  //       </figure>
  //     <!-- /wp:image -->
  //     `
  //   }

  //   // let columns = this.renderColumns(rows);
  //   // console.log(columns);
  //   gallery.innerHTML = html+'</figure><!-- /wp:gallery -->';
  // }

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
    } else if ( node.nodeName === '#comment' ) {
      state.html += `<!-- ${node.textContent} -->`;
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


    state.html += this.renderColumns(table);
    console.log(this.renderColumns(table))
  }

  checkBlockEnd(state) {
    if( state.defaultBlock === true ) {
      state.defaultBlock = false;
      state.html += '</p>\n';
    }
  }

  handleListDescriptions(item) {
    let rows = [];
    let row;

    for( let i = 0; i < item.list_items.length; i++ ) {
      if( i%2 === 0 ) {
        row = [];
        rows.push(row);
      }

      let content = item.list_items[i].description;

      content = content
        .trim()
        .replace(/<ul>/g, '<!-- wp:list --><ul class="list-arrow">')
        .replace(/<\/ul>/g, '</ul><!-- /wp:list -->')

      row.push(`
        <!-- wp:heading {"level":3} -->
        <h3>${item.list_items[i].title}</h3>
        <!-- /wp:heading -->
        ${content}
      `);
    }


    return `
      <h2 id="${item.anchor_label}">${item.block_title}</h2>
      ${this.renderColumns(rows)}
    `
  }

  handleLinkListNew(item) {
    let columns = [[], []];

    for( let i = 0; i < item.links.length; i++ ) {
      columns[i%2].push(`<a href="${item.links[i].external_url || item.links[i].internal_url}" target="_blank">${item.links[i].title}</a>`)
    }
    columns = columns.map(column => {
      return `<!-- wp:list --><ul class="list--arrow"><li>${column.join('</li><li>')}</li></ul><!-- /wp:list -->`
    });

    return `
      <h2 id="${item.anchor_label}">${item.block_title}</h2>
      <!-- wp:paragraph -->
      <p>${item.introduction}</p>
      <!-- /wp:paragraph -->
      ${this.renderColumns([columns])}
    `
  }

  renderColumns(rows) {
    return rows.map(row => `<!-- wp:ucd-theme/layout-columns -->
      ${row.map((column, i) => {
        let content = column.trim();
        if( !content.match(/^<!-- /) ) {
          content = `<!-- wp:paragraph -->
          <p>${content}</p>
          <!-- /wp:paragraph -->`
        }

        return `<!-- wp:ucd-theme/column {"layoutClass":"l-${this.UCD_COLUMN_INDEX_NAMES[i+1]}","forbidWidthEdit":true} -->
        ${content}
        <!-- /wp:ucd-theme/column -->
      `
      }).join('\n')}
    <!-- /wp:ucd-theme/layout-columns -->`).join('\n');
  }
  

}

const instance = new FlexContentTransform();
export default instance;