import dotenv from "dotenv";

dotenv.config();
const env = process.env;

class config {

  constructor(env) {

    this._setDefaults(env);

    if ( this.project === 'main-library-website' ){
      this._setMainLibraryWebsiteValues(env);
    } else if ( this.project === 'datalab-main-site' ){
      this._setDatalabValues(env);
    }
  }

  _setDefaults(env) {

    this.project = env.PROJECT;

    this.server = {
      port : env.PORT || env.SERVER_PORT || 3000
    };

    this.google = {
      keyPath : env.GOOGLE_APPLICATION_CREDENTIALS,
      storage : {
        apiRoot : 'https://storage.googleapis.com/storage/v1/b/',
        bucket : env.GOOGLE_STORAGE_BUCKET,
      },
      bigquery : {
        dataset : ''
      }
    };

    this.libguides = {
      host : '',
      azQueryPath : '/az.php?q='
    };

    this.source = {
      host : env.SOURCE_HOST,
      apiPath : '/wp-json/wp/v2',
      username : env.SOURCE_API_USERNAME,
      key : env.SOURCE_API_KEY,
    };

    this.sink = {
      host : env.SINK_HOST,
      apiPath : '/wp-json/wp/v2',
      redirectApiPath : '/wp-json/redirection/v1/redirect',
      username : env.SINK_API_USERNAME,
      key : env.SINK_API_KEY,
    };

    this.sitemapIgnore = [];

    this.commonLinks = [];

    this.urlMap = {};

    this.categoryMap = {};
    this.catToTags = [];

  }

  _setDatalabValues(env) {
    this.source.host = this.source.host || 'https://datalab.ucdavis.edu';
  }

  _setMainLibraryWebsiteValues(env) {
    this.google.bucket = this.google.bucket || 'website-v3-migration';
    this.google.bigquery.dataset = 'website_v3_migration';

    this.libguides.host = 'https://guides.library.ucdavis.edu';

    this.source.host = this.source.host || 'https://rc.library.ucdavis.edu';

    this.sink.host = this.sink.host || 'http://sandbox.library.ucdavis.edu';

    this.sitemapIgnore = [
      /wp-sitemap-taxonomies/,
      /wp-sitemap-posts-text_widget/,
      /wp-sitemap-posts-serial/
    ];

    this.commonLinks = [
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
    ];

    // from: https://docs.google.com/document/d/1t-dxUyXaqfiePccI6rI6J5Gzh2b40EczCQSWvPKGqzA/edit
    this.categoryMap = {
      "Data & Digital Scholarship" : {
        name : "Data Science",
        slug : "data-science",
        description : ""
      },
      "Wine" : {
        name : "Food and Wine",
        slug : "food-and-wine",
        description : ""
      },
      "Local History" : {
        name : "Campus and Local History",
        slug : "campus-and-local-history",
        description : ""
      },
      "University Archives" : {
        name : "Campus and Local History",
        slug : "campus-and-local-history",
        description : ""
      },
      "Scholarly Communication" : {
        name: "Open Access and Scholarly Publishing",
        slug : "open-access-and-scholarly-publishing",
        description : ""
      },
      "Research Support" : {
        name : "Research Tools and Services",
        slug : "research-tools-and-services",
        description : ""
      }
    };

    this.catToTags = [
      "Interviews",
      "BIBFLOW",
      "ICIS",
      "Photography",
      "Maps & GIS",
    ];
  }

}

export default new config(env);
