PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'homepage',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE feature_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_key TEXT NOT NULL UNIQUE,
  votes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE generated_names (
id INTEGER PRIMARY KEY AUTOINCREMENT,
keywords TEXT NOT NULL,
name TEXT NOT NULL,
meaning TEXT,
inspiration TEXT,
score REAL,
memorability TEXT,
brandability TEXT,
professionalism TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(1,'begin,finish','Start Line Stories','Tales of beginnings and the journey to the end.','Races and marathons as metaphors for life''s phases.',8.2,'High','Medium','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(2,'begin,finish','The Bookend Effect','Exploring how beginnings and endings shape narratives.','Physical bookends symbolize the container of a story.',8.7,'High','High','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(3,'begin,finish','Alpha Omega Hour','Discussions on the first and last things in life.','Greek letters alpha and omega denote start and finish.',7.9,'Medium','Medium','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(4,'begin,finish','From Scratch to Sign Off','Chronicles of projects from start to completion.','Cooking from raw ingredients to final dish.',8.4,'High','High','Medium','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(5,'begin,finish','First & Final Word','Analyzing pivotal opening and closing statements.','Bookends of speeches and debates.',8.1,'Medium','Medium','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(6,'begin,finish','Launchpad Landing','Journeys from liftoff to safe return.','Space missions as a metaphor for any complete cycle.',7.6,'Medium','Medium','Low','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(7,'begin,finish','The Commencement Concludes','Reflections on how endings emerge from beginnings.','Graduation ceremonies mark both start and finish.',7.3,'Low','Low','Medium','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(8,'begin,finish','Genesis to Amen','Exploring change from creation to finality.','Biblical terms for beginning and ending rituals.',7.8,'Medium','Low','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(9,'begin,finish','Dawn Dusk Dialogues','Conversations about cycles and transitions.','Natural times of day as symbols for start and finish.',8.5,'High','High','High','2026-06-26 12:32:40');
INSERT INTO "generated_names" ("id","keywords","name","meaning","inspiration","score","memorability","brandability","professionalism","created_at") VALUES(10,'begin,finish','Edge to Edge','Stories spanning from one boundary to another.','Perimeters of maps or physical spaces.',7.4,'Medium','Medium','Low','2026-06-26 12:32:40');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('generated_names',10);
