CREATE TABLE all_games(
    gameid bigint primary key,
    time timestamptz,
    hometeam varchar(255),
    awayteam varchar(255),
    homescore int,
    awayscore int
);