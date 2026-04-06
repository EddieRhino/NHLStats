CREATE TABLE pre_stats_goalie (
    playerid BIGINT NOT NULL,
    gameid   BIGINT NOT NULL,
    shots_faced INTEGER,
    saves INTEGER,
    CONSTRAINT preg_stats_goalie_pkey PRIMARY KEY (playerid, gameid)
);