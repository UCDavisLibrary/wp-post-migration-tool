import {BigQuery} from '@google-cloud/bigquery';
import {Storage} from '@google-cloud/storage';
import config from './config.js';
import path from 'path';

class BigQueryWrapper {

  constructor() {
    this.bigquery = new BigQuery();
    this.storage = new Storage();
  }

  async overwrite(gcsFile, fields) {
    const metadata = {
      sourceFormat: 'CSV',
      skipLeadingRows: 1,
      schema: {
        fields,
      },
      // Set the write disposition to overwrite existing table data.
      writeDisposition: 'WRITE_TRUNCATE',
    };

    // Load data from a Google Cloud Storage file into the table
    const [job] = await this.bigquery
      .dataset(config.google.bigquery.dataset)
      .table(path.parse(gcsFile).name)
      .load(this.storage.bucket(config.google.storage.bucket).file(gcsFile), metadata);

    return job;
  }


}

const instance = new BigQueryWrapper();
export default instance;