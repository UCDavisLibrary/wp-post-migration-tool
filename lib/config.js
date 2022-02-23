const env = process.env;

const config = {
  source : {
    host : 'https://rc.library.ucdavis.edu',
    apiPath : '/wp-json/wp/v2',
    username : env.SOURCE_API_USERNAME || '',
    key : env.SOURCE_API_KEY || '',
  },
  sink : {
    // host : 'https://rebrand.library.ucdavis.edu',
    host : 'http://localhost:3000',
    apiPath : '/wp-json/wp/v2',
    username : env.SINK_API_USERNAME || '',
    key : env.SINK_API_KEY || '',
  }
}

export default config;