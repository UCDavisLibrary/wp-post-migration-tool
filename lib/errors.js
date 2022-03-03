import fs from 'fs';
import path from 'path';

class Errors {

  constructor() {
    this.errorsFile = path.join(process.cwd(), '.errors.json');
    if( fs.existsSync(this.errorsFile) ) {
      this.errors = JSON.parse(fs.readFileSync(this.errorsFile), 'utf-8');
    } else {
      this.errors = {};
    }
  }

  handle(post, message={}) {
    message.slug = post.slug;
    this.errors[post.id] = message;
    this.save(); 
  }

  remove(postId) {
    if( !this.errors[postId] ) return;
    delete this.errors[postId];
    this.save();
  }

  save() {
    fs.writeFileSync(this.errorsFile, JSON.stringify(this.errors, '  ', '  '));
  }

}

const instance = new Errors();
export default instance;