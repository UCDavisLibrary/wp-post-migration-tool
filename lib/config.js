import dotenv from "dotenv";

dotenv.config();
const env = process.env;

const config = {
  source : {
    host : env.SOURCE_HOST || 'https://rc.library.ucdavis.edu',
    apiPath : '/wp-json/wp/v2',
    username : env.SOURCE_API_USERNAME || '',
    key : env.SOURCE_API_KEY || '',
  },
  sink : {
    host :  env.SINK_HOST || 'http://localhost:3000',
    apiPath : '/wp-json/wp/v2',
    username : env.SINK_API_USERNAME || '',
    key : env.SINK_API_KEY || '',
  },

  commonLinks : [
    "/library/peter-j-shields/",
    "/library/carlson-health-sciences/",
    "/library/blaisdell-medical/",
    "/library/uc-davis-law/",
    "/location/peter-j-shields/",
    "/location/peter-j-shields-library/",
    "/location/carlson-health-sciences/",
    "/location/blaisdell-medical/",
    "/location/uc-davis-law/",
    "/location/carlson-health-sciences-library/",
    "/location/mabie-law-library/",
    "/location/blaisdell-medical-library/",
    "/location/archives-and-special-collections/",
    "/archives-and-special-collections/",
    "/events/",
    "/browse-subjects/",
    "/alumni-friends/areas-to-support/",
    "/alumni-friends/inspiring-stories/",
    "/alumni-friends/recognition-and-resources/",
    "/alumni-friends/ways-to-give/",
    "/about/",
    "/hours/",
    "/about/mission-vision-values/",
    "/about/strategic-planning-process/",
    "/about/strategic-framework/",
    "/about/university-librarian/",
    "/about/organizational-chart/",
    "/about/history-of-the-library/",
    "/about/architecture/",
    "/about/people-behind-buildings-collections/",
    "/space/",
    "/news/",
    "/about/leadership-board/",
    "/library-policies/",
    "/service/careers/",
    "/lang-prize/",
    "/lang-prize/how-to-apply/",
    "/lang-prize/faq/",
    "/lang-prize/winners/",
    "/lang-prize/about-norma-j-lang/"
  ],

  urlMap : {}
}

export default config;