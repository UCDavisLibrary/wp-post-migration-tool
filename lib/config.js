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
    this.dropCategoriesByDefault = false;
    this.dropTagsByDefault = false;
    this.tagAssignments = {};
    this.categoryAssignments = {};

  }

  _setDatalabValues(env) {
    this.source.host = this.source.host || 'https://datalab.ucdavis.edu';

    // https://docs.google.com/spreadsheets/d/13fRsaZrtdU3uZthuEWkVrVM_w6grtVKeGxjm43BH8ig/edit#gid=868764265
    this.dropCategoriesByDefault = true;
    this.dropTagsByDefault = true;

    this.tagAssignments = {
      "maptimeDavis": {
        "tags": [
          "Research and Learning Cluster",
          "Spatial Sciences",
          "maptimeDavis"
        ],
        "categories": [
          "Community"
        ]
      },
      "upcoming_community": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "upcoming_events": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "3D": {
        "tags": [
          "Data Visualization",
          "3D Data"
        ],
        "categories": [
          "Research"
        ]
      },
      "ADVANCED TEXT ANALYSIS": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": []
      },
      "Affiliated Event": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "Amazon Web Services": {
        "tags": [
          "Cloud Computing",
          "Remote Computing"
        ],
        "categories": []
      },
      "Anaconda": {
        "tags": [
          "Anaconda",
          "Environment Management",
          "Python"
        ],
        "categories": []
      },
      "API": {
        "tags": [
          "API",
          "Data Access"
        ],
        "categories": []
      },
      "Applied Bayesian Statistics": {
        "tags": [
          "Research and Learning Cluster",
          "Bayesian Statistics"
        ],
        "categories": [
          "Community"
        ]
      },
      "ArcGIS": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "AWS": {
        "tags": [
          "Cloud Computing",
          "Remote Computing"
        ],
        "categories": []
      },
      "Azure": {
        "tags": [
          "Cloud Computing",
          "Remote Computing"
        ],
        "categories": []
      },
      "Bayes": {
        "tags": [
          "Bayesian Statistics"
        ],
        "categories": []
      },
      "Bayesian": {
        "tags": [
          "Bayesian Statistics"
        ],
        "categories": []
      },
      "Bibliographies": {
        "tags": [
          "Bibliometrics"
        ],
        "categories": []
      },
      "Bibliometric Dat": {
        "tags": [
          "Bibliometrics"
        ],
        "categories": []
      },
      "C/C++": {
        "tags": [
          "C/C++"
        ],
        "categories": []
      },
      "Campus Event": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "Cartography": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "CaSITA": {
        "tags": [
          "Datasets",
          "Spatial Sciences"
        ],
        "categories": []
      },
      "census": {
        "tags": [
          "Datasets"
        ],
        "categories": []
      },
      "cloud-computing": {
        "tags": [
          "Remote Computing"
        ],
        "categories": []
      },
      "Cluster Computing": {
        "tags": [
          "Remote Computing"
        ],
        "categories": []
      },
      "Colab Project": {
        "tags": [],
        "categories": [
          "Research"
        ]
      },
      "Command line": {
        "tags": [
          "Command Line"
        ],
        "categories": []
      },
      "computational pedagogy": {
        "tags": [
          "Research and Learning Cluster",
          "Computational Pedagogy"
        ],
        "categories": [
          "Community"
        ]
      },
      "Computer Vision": {
        "tags": [
          "Computer Vision"
        ],
        "categories": []
      },
      "Coronavirus (2019-nCoV)": {
        "tags": [
          "COVID"
        ],
        "categories": [
          "Research"
        ]
      },
      "COVID-19": {
        "tags": [
          "COVID"
        ],
        "categories": [
          "Research"
        ]
      },
      "Data Education": {
        "tags": [],
        "categories": [
          "Education"
        ]
      },
      "Data Feminism": {
        "tags": [
          "Research and Learning Cluster",
          "Data Feminism"
        ],
        "categories": [
          "Community"
        ]
      },
      "Data Visualization": {
        "tags": [
          "Data Visualization"
        ],
        "categories": []
      },
      "Databases": {
        "tags": [
          "Databases"
        ],
        "categories": []
      },
      "DataFest": {
        "tags": [
          "Data Challenge"
        ],
        "categories": [
          "Events"
        ]
      },
      "DataLab Event": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "datalab events": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "DataLab Faculty": {
        "tags": [
          "People"
        ],
        "categories": [
          "Community"
        ]
      },
      "DataLab Staff": {
        "tags": [
          "People"
        ],
        "categories": [
          "Community"
        ]
      },
      "DATASET SOURCES": {
        "tags": [
          "Datasets"
        ],
        "categories": []
      },
      "Davis Python Users Group": {
        "tags": [
          "Research and Learning Cluster",
          "User Group",
          "Python",
          "Davis Python Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Davis R Users Group": {
        "tags": [
          "Research and Learning Cluster",
          "User Group",
          "Python",
          "Davis R Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Digi AVAs": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": [
          "Research"
        ]
      },
      "Digital Humanities": {
        "tags": [
          "Research and Learning Cluster",
          "Digital Humanities"
        ],
        "categories": [
          "Community"
        ]
      },
      "Digital Scholarship Publications": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": []
      },
      "Dynamic Visualization": {
        "tags": [
          "Data Visualization"
        ],
        "categories": []
      },
      "EBBA": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": []
      },
      "Education Resources For Use & Management of Data": {
        "tags": [],
        "categories": [
          "Education"
        ]
      },
      "Election Data Challange": {
        "tags": [
          "Data Challenge",
          "CA Election Data Challenge"
        ],
        "categories": [
          "Events"
        ]
      },
      "Election Data Chellenge": {
        "tags": [
          "Data Challenge",
          "CA Election Data Challenge"
        ],
        "categories": [
          "Events"
        ]
      },
      "Event": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "Events": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "geocoding": {
        "tags": [
          "Spatial Sciences",
          "Geocoding"
        ],
        "categories": []
      },
      "geospatial": {
        "tags": [
          "Spatial Sciences",
          "Geospatial"
        ],
        "categories": []
      },
      "GIS": {
        "tags": [
          "Spatial Sciences",
          "Geospatial",
          "GIS"
        ],
        "categories": []
      },
      "git": {
        "tags": [
          "Version Control",
          "Git"
        ],
        "categories": []
      },
      "GitHub": {
        "tags": [
          "Version Control",
          "GitHub"
        ],
        "categories": []
      },
      "google earth": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "Google Earth Engine": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "Hack for California": {
        "tags": [
          "Research and Learning Cluster",
          "Hack for California"
        ],
        "categories": [
          "Community"
        ]
      },
      "Hackathon": {
        "tags": [
          "Data Challenge",
          "Hackathon"
        ],
        "categories": [
          "Events"
        ]
      },
      "Health Data": {
        "tags": [
          "Health Data Science"
        ],
        "categories": []
      },
      "Health Data Science & Systems": {
        "tags": [
          "Research and Learning Cluster",
          "Health Data Science"
        ],
        "categories": [
          "Community"
        ]
      },
      "Health Data Science and Systems": {
        "tags": [
          "Research and Learning Cluster",
          "Health Data Science"
        ],
        "categories": [
          "Community"
        ]
      },
      "Hood Canal Landscape": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": [
          "Research"
        ]
      },
      "HPC": {
        "tags": [
          "Remote Computing"
        ],
        "categories": []
      },
      "Image Recognition": {
        "tags": [
          "Computer Vision"
        ],
        "categories": []
      },
      "InstallFest": {
        "tags": [
          "InstallFest"
        ],
        "categories": [
          "Events"
        ]
      },
      "intermediate python": {
        "tags": [
          "Python"
        ],
        "categories": []
      },
      "intermediate R": {
        "tags": [
          "R"
        ],
        "categories": []
      },
      "JavaScript": {
        "tags": [
          "JavaScript"
        ],
        "categories": []
      },
      "Julia": {
        "tags": [
          "Research and Learning Cluster",
          "User Group",
          "UC Julia Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Julia Learning Group": {
        "tags": [
          "Research and Learning Cluster",
          "User Group",
          "UC Julia Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Julia Users Group meetup": {
        "tags": [
          "Research and Learning Cluster",
          "User Group",
          "UC Julia Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Jupyter": {
        "tags": [
          "Jupyter"
        ],
        "categories": []
      },
      "KeckCAVES": {
        "tags": [
          "Data Visualization"
        ],
        "categories": [
          "Research"
        ]
      },
      "Learn more about the challenge's goals": {
        "tags": [
          "Data Challenge"
        ],
        "categories": [
          "Events"
        ]
      },
      "Mackine Learning": {
        "tags": [
          "Machine Learning"
        ],
        "categories": []
      },
      "Moving Ahead with Support for Digital Humanities": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": []
      },
      "natural language processing": {
        "tags": [
          "Digital Humanities",
          "NLP",
          "Natural Language Processing"
        ],
        "categories": []
      },
      "NETWORK TOOLS": {
        "tags": [
          "Network Analysis"
        ],
        "categories": []
      },
      "network visualization": {
        "tags": [
          "Network Analysis",
          "Data Visualization"
        ],
        "categories": []
      },
      "NLP": {
        "tags": [
          "Digital Humanities",
          "NLP",
          "Natural Language Processing"
        ],
        "categories": []
      },
      "NLP for Healthcare": {
        "tags": [
          "Health Data Science",
          "Natural Language Processing",
          "NLP"
        ],
        "categories": []
      },
      "OCR": {
        "tags": [
          "OCR",
          "Optical Character Recognition"
        ],
        "categories": []
      },
      "Open Data": {
        "tags": [
          "Open Data"
        ],
        "categories": []
      },
      "OpenStreetMap": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "Optical Character Recognition": {
        "tags": [
          "OCR",
          "Optical Character Recognition"
        ],
        "categories": []
      },
      "Parallel Computing": {
        "tags": [
          "Parallel Computing"
        ],
        "categories": []
      },
      "Python": {
        "tags": [
          "Python"
        ],
        "categories": []
      },
      "Python Meet-up": {
        "tags": [
          "Research and Learning Cluster",
          "Users Group",
          "Python",
          "Davis Python Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "QGIS": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "Quintessance": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": [
          "Research"
        ]
      },
      "R": {
        "tags": [
          "R"
        ],
        "categories": []
      },
      "R basics": {
        "tags": [
          "R"
        ],
        "categories": []
      },
      "R language": {
        "tags": [
          "R"
        ],
        "categories": []
      },
      "R meet-up": {
        "tags": [
          "Research and Learning Cluster",
          "Users Group",
          "Davis R Users Group",
          "R"
        ],
        "categories": [
          "Community"
        ]
      },
      "raster": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "regression": {
        "tags": [
          "Statistics"
        ],
        "categories": []
      },
      "Regular Expressions": {
        "tags": [
          "Data Wrangling"
        ],
        "categories": []
      },
      "reproducible research": {
        "tags": [
          "Reproducible Research"
        ],
        "categories": []
      },
      "Research and Learning Cluster": {
        "tags": [
          "Research and Learning Cluster"
        ],
        "categories": [
          "Community"
        ]
      },
      "Research Cluster": {
        "tags": [
          "Research and Learning Cluster"
        ],
        "categories": [
          "Community"
        ]
      },
      "rstats": {
        "tags": [
          "R"
        ],
        "categories": []
      },
      "Shiny": {
        "tags": [
          "Data Visualization",
          "Shiny"
        ],
        "categories": []
      },
      "Sign up to talk with over 20 domain experts and technical mentors from across the university. Register now for the Challenge Kickoff! And": {
        "tags": [
          "Data Challenge",
          "CA Election Data Challenge"
        ],
        "categories": [
          "Events"
        ]
      },
      "Spatial": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "spatial data infrastructure": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "Spatial Sciences": {
        "tags": [
          "Spatial Sciences"
        ],
        "categories": []
      },
      "SQL": {
        "tags": [
          "Databases",
          "SQL"
        ],
        "categories": []
      },
      "Stan": {
        "tags": [
          "Bayesian Statistics"
        ],
        "categories": []
      },
      "statistical graphics": {
        "tags": [
          "Data Visualization"
        ],
        "categories": []
      },
      "Text Analytics": {
        "tags": [
          "Digital Humanities",
          "Text Analysis"
        ],
        "categories": []
      },
      "TEXT CORPUS EXPLORATION THROUGH GUI": {
        "tags": [
          "Digital Humanities",
          "Text Analysis"
        ],
        "categories": []
      },
      "TEXT CORPUS EXPLORATION THROUGH WEB INTERFACE": {
        "tags": [
          "Digital Humanities",
          "Text Analysis"
        ],
        "categories": []
      },
      "Text Mining": {
        "tags": [
          "Digital Humanities",
          "Text Analysis"
        ],
        "categories": []
      },
      "Topic Modeling": {
        "tags": [
          "Digital Humanities",
          "Natural Language Processing",
          "NLP"
        ],
        "categories": []
      },
      "UC Julia Users Group": {
        "tags": [
          "Research and Learning Cluster",
          "Users Group",
          "Julia",
          "UC Julia Users Group"
        ],
        "categories": [
          "Community"
        ]
      },
      "Unix": {
        "tags": [
          "Command Line"
        ],
        "categories": []
      },
      "UpcomingEvent": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "Version Control": {
        "tags": [
          "Version Control"
        ],
        "categories": []
      },
      "virtual reality": {
        "tags": [
          "Data Visualization"
        ],
        "categories": []
      },
      "VR": {
        "tags": [
          "Data Visualization",
          "Virtual Reality"
        ],
        "categories": []
      },
      "Webscraping": {
        "tags": [
          "Webscraping"
        ],
        "categories": []
      },
      "Workshop": {
        "tags": [
          "Workshop"
        ],
        "categories": [
          "Education"
        ]
      }
    };

    this.categoryAssignments = {
      "Affiliates Programs": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "Community": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "Digital Humanities": {
        "tags": [
          "Digital Humanities"
        ],
        "categories": []
      },
      "Events": {
        "tags": [],
        "categories": [
          "Events"
        ]
      },
      "Health Data Science and Systems RLC": {
        "tags": [
          "Research and Learning Cluster",
          "Health Data Science"
        ],
        "categories": [
          "Community"
        ]
      },
      "Jobs": {
        "tags": [],
        "categories": [
          "Opportunities"
        ]
      },
      "Opportunities": {
        "tags": [],
        "categories": [
          "Opportunities"
        ]
      },
      "Projects": {
        "tags": [],
        "categories": [
          "Research"
        ]
      },
      "Active Projects": {
        "tags": [],
        "categories": [
          "Research"
        ]
      },
      "Collaborations": {
        "tags": [],
        "categories": [
          "Research"
        ]
      },
      "Past Projects": {
        "tags": [],
        "categories": [
          "Research"
        ]
      },
      "Research Clusters": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "DHRC": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "Spatial Science RLC": {
        "tags": [],
        "categories": [
          "Community"
        ]
      },
      "Workshop": {
        "tags": [],
        "categories": [
          "Education"
        ]
      }
    };
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
