select * from reg_games
where gameid::text like '2024%'
order by time asc
limit 100;