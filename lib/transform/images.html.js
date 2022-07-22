import { JSDOM } from "jsdom";

function transform(html) {
  let window = new JSDOM(html).window;

  let eles = Array
    .from(window.document.body.querySelectorAll('img'));

  for( let ele of eles ) {
    transformElement(window, ele);
  }

  return window.document.body.innerHTML;
}

function transformElement(window, ele) {
  if( ele.nodeName === 'A' ) {
    ele = ele.parentElement;
  }

  // console.log('\n------------');
  // console.log(ele.parentElement.outerHTML)
  // console.log('============');

  let gbParams = {};
  let replaceHolder = null;

  let caption = ele.parentElement.querySelector('.wp-caption-text');
  if( !caption ) caption = ele.parentElement.querySelector('strong');
  let img = ele.nodeName === 'IMG' ? ele : ele.querySelector('img');
  let anchor = img.parentElement.nodeName === 'A' ? ele.parentElement : null;


  // are we dealing with native wp image block
  let isAttachmentBlock = false;
  if( (ele.parentElement.id || '').match(/^attachment_/) && ele.parentElement.nodeName === 'DIV' ) {
    isAttachmentBlock = true;
    ele.parentElement.classList.remove('wp-caption');
    gbParams.id = ele.parentElement.id.replace(/^attachment_/, '');
    ele.parentElement.id = '';
    replaceHolder = ele.parentElement;
  } else {
    replaceHolder = img;
  }

  let root = window.document.createElement('figure');
  root.className = 'wp-block-image wp-caption';

  let newImg = window.document.createElement('img');
  newImg.src = img.src;
  newImg.alt = img.alt;
  
  if( img.getAttribute('height') ) {
    newImg.setAttribute('height', img.getAttribute('height'))
  } else if ( ele.getAttribute('height') ) {
    newImg.setAttribute('height', ele.getAttribute('height'))
  }
  if( img.getAttribute('width') ) {
    newImg.setAttribute('width', img.getAttribute('width'))
  } else if ( ele.getAttribute('width' ) ) {
    newImg.setAttribute('width', ele.getAttribute('width'))
  }

  let newAnchor = window.document.createElement('a');

  if( anchor ) {
    if( !isAttachmentBlock ) {
      replaceHolder = anchor;
    }
    newAnchor.href = anchor.href;
    root.appendChild(newAnchor);
    newAnchor.appendChild(newImg);
    gbParams.linkDestination = 'custom';
  } else {
    root.appendChild(newImg);
  }

  if( caption ) {
    // console.log('-------- CAPTION ----------')
    let figcap = window.document.createElement('figcaption');
    figcap.innerHTML = caption.textContent;
    root.appendChild(figcap);
    caption.remove();
  }

  // handle align
  let alignEle = isAttachmentBlock ? ele.parentElement : img;
  let align = null;
  alignEle.classList.forEach(item => {
    if( item.match(/^align/) && item !== 'alignnone' ) align = item.replace(/^align/, ''); 
  });
  if( align ) {
    root.classList.add('align'+align);
    gbParams.align = align;
  }

  // let comment = window.document.createComment(` wp:image  `);
  // let closeComment = window.document.createComment(' /wp:image ');

  let content = replaceHolder.parentElement;
  // replaceHolder.parentElement.insertBefore(comment, replaceHolder);
  replaceHolder.parentElement.insertBefore(root, replaceHolder);
  // replaceHolder.parentElement.insertBefore(closeComment, replaceHolder);

  if( anchor ) anchor.remove();
  else img.remove();

  if( isAttachmentBlock ) replaceHolder.remove();

  // remove old caption spacer
  if( isAttachmentBlock ) {
    let oldSpacer = content.querySelector('.spacer-half');
    if( oldSpacer ) oldSpacer.remove();
  }

  // console.log(content.outerHTML);
  // console.log('+++++++++++\n');
}

export default transform;
export {transformElement}