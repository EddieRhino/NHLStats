select * from reg_games
where hometeam like 'MIN'
UNION
select * from reg_games
where awayteam like 'MIN'
order by time asc;
