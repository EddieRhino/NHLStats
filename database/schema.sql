create table players(
    playerid serial PRIMARY KEY,
    apiid integer unique,
    name text not null,
    team text,
    position text,
    shoots VARCHAR(1),
    height_cm INTEGER,
    weight_lbs INTEGER,
    birth_date DATE
);
