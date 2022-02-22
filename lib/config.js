const env = process.env;

const config = {
  source : {
    host : 'https://rc.library.ucdavis.edu',
    apiPath : '/wp-json/wp/v2'
  },
  sink : {
    host : 'https://rebrand.library.ucdavis.edu',
    apiPath : '/wp-json/wp/v2',
    username : env.SINK_API_USER || '',
    key : env.SINK_API_KEY || '',
  }
}

export default config;